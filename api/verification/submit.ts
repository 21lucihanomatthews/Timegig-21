export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { selfieUrl, idFileName } = body;

    if (!selfieUrl || !idFileName) {
      return res.status(400).json({
        success: false,
        error: 'Selfie and ID document are both required.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification submission received. Review takes about 15 to 25 minutes.',
      submissionId: `verif_${Date.now()}`,
    });
  } catch (err: any) {
    console.error('Verification submission error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit verification',
    });
  }
}
