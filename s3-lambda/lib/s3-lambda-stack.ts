import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

const runtime = Runtime.NODEJS_20_X;
const RESOURCE_PREFIX = 's3Lambda-';

export class S3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fnProps: lambda.NodejsFunctionProps = {
      runtime,
    };
    const fn = new lambda.NodejsFunction(this, `${RESOURCE_PREFIX}Fn`, {
      ...fnProps,
      entry: join(__dirname, '../src/fn.ts'),
    });

    const bucket = new s3.Bucket(this, `${RESOURCE_PREFIX}Bucket`, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(fn)
    );
    bucket.grantRead(fn);
  }
}
