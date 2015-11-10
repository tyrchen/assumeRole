# AWS 及 IAM 答疑

以下是昨日的公众号文章 [『深入了解IAM和访问控制』](http://mp.weixin.qq.com/s?__biz=MzA3NDM0ODQwMw==&mid=400379741&idx=1&sn=8dd705c3ec9d8af89d38b3eaa10cafff#rd) 发布之后，一些读者的疑问。

__Q: 我想开始学习 AWS，从哪里入手？__

A: 先去注册 AWS account，然后看官方的文档。AWS 头一年很多服务在一定的额度下都是免费使用的，如果只是学习，不会有任何花费。不过要注意在你不用的时候或者一年后清理所使用的资源。有些读者使用了一年，忘记了，结果交了好几十甚至好几百的冤枉钱。

__Q: 我已经注册账号了，怎么入门？__

A: 开始入门 AWS 的时候，非常不建议大家使用 AWS management console。图形界面上的操作很不利于学习和总结，往往是做了一系列复杂的操作之后，自己都把自己绕晕了，下次做相同的事情，不看文档还是不知道怎么做。最好的入门是使用 AWS CLI 和 AWS SDK。比如要学习 S3，那就尝试着使用 AWS CLI 创建 bucket，给 bucket 设置权限，添加文件，删除文件等。然后同样的事情再用 SDK 尝试一下。AWS SDK 的文档并不是十分清晰，所以先从 CLI 入手理解概念会有助于你使用 SDK。

__Q: saws 是个什么鬼？__

A: saws 是个 AWS CLI 的辅助工具。你可以在 github 上找到这个工具的源代码和使用说明。它为 AWS CLI 加入了有限的 auto completion，使用起来方便多了。在 AWS re:invent 2015 上，Amazon 也宣布他们会提供类似的，更加强大的 CLI 工具。在此之前，saws 是最好的 CLI 选择。

__Q: 有什么好的书籍资料么？__

A: 我暂时也没有找到好的书籍资料，最全面但也是最原始的资料来自于 AWS 的官方文档和官方 blog。建议遇到问题的时候 google / stackoverflow，还解决不了可以咨询程序君 —— 如果问题本身能够戳中程序君使其愿意花时间研究。:)

__Q: 怎么不介绍阿里云，这么推销 AWS，你是不是收了广告费？__

A: 阿里云虽然很有潜力，但目前和 AWS 不在一个量级。Azure 我没有使用过，所以没有发言权。我喜欢 AWS，自己在大量使用，也希望把我学到的分享出来，促成我自己的二次学习，至于广告费嘛，我倒是真心希望 Amazon 能够给我点广告费，至少给我些 credit 涵盖我日常的 AWS 花费，或者赞助我的 AWS re:invent 的门票。

__Q: 能不能介绍 AWS 和 Openstack 的异同？__

A: 不能。没有调查就没有发言权。何况我目前没有深入研究 openstack 的动力。

__Q: 中国区的 AWS 没有 cognito，如何在 IOS SDK 里面（通过 IAM）使用 DynamoDB？__

A: 终于看到一个和 IAM 相关的问题，泪流满面。接下来我好好回答一下。

我没有遇见过类似的情况，所以斗胆建议两个 solution：

* 创建一个 user，为其分配 DynamoDB 相关 table 的权限，并生成 AccessKey。在 IOS 的代码中，使用这个 user 访问 DynamoDB。
* 创建一个 user，没有任何权限，但是允许它 AssumeRole 到一个拥有 DynamoDB 相关 table 的 role 上面。使用这个 user 访问 DynamoDB。

两种方式都不算太好，因为这个用户被写死在 IOS 的代码中。但既然问题的前提是无法使用 cognito，那么，在矮子里拔将军，我们选后一个 solution。因为，通过 AssumeRole 和 STS (Security Token Service) 产生临时的可以访问 DynamoDB 的 AccessKey 和 Session，更安全一些，也能够一定程度辨识用户（通过 SessionToken）。

首先我们需要创建一个 Role，允许其执行 ``sts:AssumeRole``，这个 role 的 policy 见：[Role policy](assume-role.json).

接下来创建这个 role：

```bash
saws> aws iam create-role --role-name test-role --assume-role-policy-document file://assume-role.json
{
    "Role": {
        "AssumeRolePolicyDocument": {
            "Statement": [
                {
                    "Principal": {
                        "AWS": "arn:aws:iam::<account-id>:user/tyr"
                    },
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow"
                }
            ],
            "Version": "2012-10-17"
        },
        "RoleName": "test-role",
        "Path": "/",
        "Arn": "arn:aws:iam::<account-id>:role/test-role",
        "CreateDate": "2015-11-10T16:06:51.480Z",
        "RoleId": "AROAILNGFKGXQ23UJS4UW"
    }
}


```

现在这个 role 允许 tyr 这个用户去获取临时 token，提升权限，获得 role 中的权限 tyr。然而，这个 role 本身尚无任何权限，按照问题的描述，我们给这个 role 创建一个 policy，可以访问 DynamoDB 中的 table __assume-role-test__：[DynamoDB policy](assume-role-dynamo.json)

我们把这个 policy attach到 刚才创建的 role 里：

```bash
saws> aws iam create-policy --policy-name assume-role-dynamo --policy-document file://assume-role-dynamo.json
{
    "Policy": {
        "Arn": "arn:aws:iam::<account-id>:policy/assume-role-dynamo",
        "PolicyId": "ANPAI3HQWLXGZNB27KSVW",
        "Path": "/",
        "IsAttachable": true,
        "PolicyName": "assume-role-dynamo",
        "UpdateDate": "2015-11-10T16:15:13.990Z",
        "DefaultVersionId": "v1",
        "CreateDate": "2015-11-10T16:15:13.990Z",
        "AttachmentCount": 0
    }
}

saws> aws iam attach-role-policy --role-name test-role --policy-arn arn:aws:iam::<account-id>:policy/assume-role-dynamo
```

我们假设已经有一个没有任何权限的 user 叫 tyr，对于这个 user，我们需要允许其访问放在创建的 role，所以要创建一个 policy 并将其 attach 到 tyr 身上：[User policy](assume-role-user.json)，如下：

```
saws> aws iam create-policy --policy-name assume-role-user --policy-document file://assume-role-user.json
{
    "Policy": {
        "IsAttachable": true,
        "CreateDate": "2015-11-10T16:17:11.274Z",
        "AttachmentCount": 0,
        "PolicyId": "ANPAJTIZ6LLBUACBKGUGQ",
        "PolicyName": "assume-role-user",
        "Arn": "arn:aws:iam::<account-id>:policy/assume-role-user",
        "DefaultVersionId": "v1",
        "UpdateDate": "2015-11-10T16:17:11.274Z",
        "Path": "/"
    }
}

saws> aws iam attach-user-policy --user-name tyr --policy-arn arn:aws:iam::<account-id>:policy/assume-role-user
```

这样，在 AWS SDK 中就可以使用 tyr 的 AccessKey 来访问 STS，提升权限，获得临时的 AccessKey，然后访问 DynamoDB。为简便起见，下面的代码使用 nodejs：[Role code](index.js).

执行结果：

```bash
➜  assumeRole node index.js
{ ResponseMetadata: { RequestId: '9ed6bc5a-87c8-11e5-8a50-b1a80a843c85' },
  Credentials:
   { AccessKeyId: '<tyr-access-key>',
     SecretAccessKey: '<tyr-access-secret>',
     SessionToken: '<token>',
     Expiration: Tue Nov 10 2015 09:32:23 GMT-0800 (PST) },
  AssumedRoleUser:
   { AssumedRoleId: 'AROAILNGFKGXQ23UJS4UW:test-session',
     Arn: 'arn:aws:sts::<account-id>:assumed-role/test-role/test-session' } }
{ Items: [], Count: 0, ScannedCount: 0 }
```

我们看到，AssumeRole 为你创建了一个临时的 user，其 ARN 包含你在代码中指定的 RoleSessionName。对于不同的 IOS 客户端，你可以使用不同的名字，这样，即便你没有一套用户账号体系，也可以在后台分辨出不同的用户行为。如果你使用第一种方案，所有的访问都来自于用户 tyr，便无从分辨了。

相关的 policy document 和代码可以访问：https://github.com/tyrchen/assumeRole。

IOS 的处理可以以此类推。

