from flask import jsonify
import boto3
import os

# Load these from environment or config
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION")
S3_BUCKET_NAME = os.environ.get("AWS_BUCKET")

s3_client = boto3.client("s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def generate_download_link(key):
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": key},
            ExpiresIn=60  # seconds, change as needed
        )
        return jsonify({"url": presigned_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500