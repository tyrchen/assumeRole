var AWS = require('aws-sdk');

var ROLE_ARN = 'arn:aws:iam::<account-id>:role/test-role';

var TABLE = 'assume-role-test';

var sts = new AWS.STS({
  accessKeyId: '<access-key-for-tyr>',
  secretAccessKey: '<secret-for-tyr>'
});

var params = {
  RoleArn: ROLE_ARN,
  RoleSessionName: 'test-session',
  DurationSeconds: 3600
};

sts.assumeRole(params, function(err, role) {
  if (err) {
    console.log(err, err.stack);
  } else {
    console.log(role);
    var dynamodb = new AWS.DynamoDB({
      accessKeyId: role.Credentials.AccessKeyId,
      secretAccessKey: role.Credentials.SecretAccessKey,
      sessionToken: role.Credentials.SessionToken,
      region: 'us-west-2'
    });
    var params = {
      TableName: TABLE
    };
    dynamodb.scan(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
      }
    })
  }
});