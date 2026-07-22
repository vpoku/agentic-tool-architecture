#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CloudArchStack } from "./lib/cloudarch-stack";

const app = new cdk.App();
new CloudArchStack(app, "CloudArchStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-gov-west-1",
  },
  description: "CloudArch — GovCloud architecture designer + Azure migration tutor",
});
