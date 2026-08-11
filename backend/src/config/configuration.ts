export default () => ({
  verifyToken: process.env.VERIFY_TOKEN || '',
  instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  igBusinessAccountId: process.env.IG_BUSINESS_ACCOUNT_ID || '',
  railwayVolumeMountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH || ''
})
