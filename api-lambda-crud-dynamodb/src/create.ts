import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = DynamoDBDocument.from(new DynamoDB());

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body',
    };
  }
  const item =
    typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  item[PRIMARY_KEY] = randomUUID();
  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };

  const ret = await db.put(params);
  return { statusCode: 201, body: ret };
};
