from flask import jsonify
import boto3
import os
import logging as logger

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

#logger.info(boto3.client('sts').get_caller_identity())

def generate_download_link(key):
    
    try:
        response = s3_client.head_object(Bucket="convertmasterfiles", Key="software/windows/convertMaster.exe")
        logger.info(response)
        response = s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=key)
        logger.info(response)
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": key},
            ExpiresIn=300  # seconds, change as needed
        )
        logger.info(f"key={key},url={presigned_url}")
        return jsonify({"url": presigned_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500