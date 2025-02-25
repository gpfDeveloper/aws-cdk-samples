import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

const runtime = Runtime.NODEJS_20_X;
const RESOURCE_PREFIX = 'SampleCRUD-';

export class ApiLambdaCrudDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const itemsTable = new dynamodb.Table(this, `${RESOURCE_PREFIX}Items`, {
      partitionKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'Items',
      readCapacity: 1,
      writeCapacity: 1,
      billingMode: cdk.aws_dynamodb.BillingMode.PROVISIONED,

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const fnProps: lambda.NodejsFunctionProps = {
      runtime,
      environment: {
        TABLE_NAME: itemsTable.tableName,
        PRIMARY_KEY: 'itemId',
      },
    };

    const createFn = new lambda.NodejsFunction(
      this,
      `${RESOURCE_PREFIX}CreateFn`,
      {
        ...fnProps,
        entry: join(__dirname, '../src/create.ts'),
      }
    );

    const deleteOneFn = new lambda.NodejsFunction(
      this,
      `${RESOURCE_PREFIX}DeleteOneFn`,
      {
        ...fnProps,
        entry: join(__dirname, '../src/delete-one.ts'),
      }
    );

    const getAllFn = new lambda.NodejsFunction(
      this,
      `${RESOURCE_PREFIX}GetAllFn`,
      {
        ...fnProps,
        entry: join(__dirname, '../src/get-all.ts'),
      }
    );

    const getOneFn = new lambda.NodejsFunction(
      this,
      `${RESOURCE_PREFIX}GetOneFn`,
      {
        ...fnProps,
        entry: join(__dirname, '../src/get-one.ts'),
      }
    );

    const updateOneFn = new lambda.NodejsFunction(
      this,
      `${RESOURCE_PREFIX}UpdateOneFn`,
      {
        ...fnProps,
        entry: join(__dirname, '../src/update-one.ts'),
      }
    );

    itemsTable.grantWriteData(createFn);
    itemsTable.grantWriteData(deleteOneFn);
    itemsTable.grantReadData(getAllFn);
    itemsTable.grantReadData(getOneFn);
    itemsTable.grantWriteData(updateOneFn);

    const getAllInt = new apigateway.LambdaIntegration(getAllFn);
    const createInt = new apigateway.LambdaIntegration(createFn);
    const getOneInt = new apigateway.LambdaIntegration(getOneFn);
    const deleteOneInt = new apigateway.LambdaIntegration(deleteOneFn);
    const updateOneInt = new apigateway.LambdaIntegration(updateOneFn);

    const restApi = new apigateway.RestApi(this, `${RESOURCE_PREFIX}Gateway`, {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });
    const itemsApi = restApi.root.addResource('items');
    itemsApi.addMethod('GET', getAllInt);
    itemsApi.addMethod('POST', createInt);
    const itemApi = itemsApi.addResource('{id}');
    itemApi.addMethod('GET', getOneInt);
    itemApi.addMethod('DELETE', deleteOneInt);
    itemApi.addMethod('PATCH', updateOneInt);
  }
}
