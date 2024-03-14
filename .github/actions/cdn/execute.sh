aws s3 cp ./dist/ s3://${{ secrets.S3_BUCKET }}/pkg/checkout-web-sdk/${VERSION}/ --recursive  --exclude "*" --include "*.tgz" --include "*.umd.min.js" --include "*.js.map" --acl public-read
