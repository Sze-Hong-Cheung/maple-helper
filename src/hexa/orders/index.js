import archMageIl from './arch-mage-il.js'

const BY_JOB_ID = new Map([[archMageIl.jobId, archMageIl]])

export function findJobOrder(job) {
  if (!job) return null
  return BY_JOB_ID.get(job.id) ?? null
}
