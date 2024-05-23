/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env:{
    API_URL:process.env.API_URL,
    API_SOCKET_URL:process.env.API_SOCKET_URL,
    CLIENT_URL:process.env.CLIENT_URL,
    HELP_URL:process.env.HELP_URL,
    S3_ACCESS_KEY:process.env.S3_ACCESS_KEY,
    S3_SECRET_ACCESS_KEY:process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_REGION:process.env.S3_BUCKET_REGION,
    S3_BUCKET_NAME_VIDEO:process.env.S3_BUCKET_NAME_VIDEO,
    S3_BUCKET_NAME_FILE:process.env.S3_BUCKET_NAME_FILE
  },
  images: {
    domains: ['res.cloudinary.com', 'talktogo-video-storage.s3.ap-southeast-2.amazonaws.com' ],
  },
  output: 'standalone'
};

export default nextConfig;
