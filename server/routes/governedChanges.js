const router=require('express').Router();
const pool=require('../db');
const auth=require('../middleware/auth');
const {validatePlan,assertTransition}=require('../domain/changeWorkflow');
router.use(auth);
function tenant(req){const t=req.user.tenantId||req.user.tenant_id;if(!t)throw new Error('tenant-bound identity required');return String(t);}
function allowlist(){return (process.env.ALLOWED_ENVIRONMENTS||'sandbox').split(',').map(v=>v.trim()).filter(Boolean);}

router.post('/',async(req,res)=>{try{
  validatePlan(req.body,allowlist());
  const r=await pool.query(`INSERT INTO governed_changes (tenant_id,environment,artifact_digest,idempotency_key,rollback_plan,summary,state,requester_id)
    VALUES ($1,$2,$3,$4,$5,$6,'draft',$7) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
    [tenant(req),req.body.environment,req.body.artifactDigest,req.body.idempotencyKey,req.body.rollbackPlan,req.body.summary||'',req.user.id]);res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({error:e.message});}});

router.post('/:id/transition',async(req,res)=>{const client=await pool.connect();try{await client.query('BEGIN');
  const q=await client.query('SELECT * FROM governed_changes WHERE id=$1 AND tenant_id=$2 FOR UPDATE',[req.params.id,tenant(req)]);if(!q.rows[0]){await client.query('ROLLBACK');return res.status(404).json({error:'change not found'});}
  assertTransition(q.rows[0].state,req.body.to,{...req.body,requesterId:q.rows[0].requester_id,approverId:req.user.id});
  const u=await client.query(`UPDATE governed_changes SET state=$1,approval_signature=COALESCE($2,approval_signature),lease_token_hash=COALESCE($3,lease_token_hash),version=version+1,updated_at=NOW() WHERE id=$4 RETURNING *`,[req.body.to,req.body.approvalSignature||null,req.body.leaseTokenHash||null,req.params.id]);
  await client.query(`INSERT INTO governed_change_events(change_id,actor_id,from_state,to_state,details) VALUES($1,$2,$3,$4,$5)`,[req.params.id,req.user.id,q.rows[0].state,req.body.to,req.body.details||{}]);await client.query('COMMIT');res.json(u.rows[0]);
}catch(e){await client.query('ROLLBACK');res.status(409).json({error:e.message});}finally{client.release();}});
module.exports=router;
