"use client";

import type { ServiceNode } from "@cloudarch/shared";
import { BackendVisualizer } from "@/components/learning/BackendVisualizer";

const SERVICE_LEARNING: Record<string, { what: string; govcloud: string; docs: string }> = {
  "Amazon S3": {
    what: "S3 stores files (documents, images, backups) as objects in buckets. When a user uploads a document, it lands in a bucket with encryption applied automatically.",
    govcloud: "Use SSE-KMS with customer-managed keys. Enable versioning and block all public access. Data stays in us-gov-west-1.",
    docs: "https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-s3.html",
  },
  "AWS Lambda": {
    what: "Lambda runs code in response to events without managing servers. When a document arrives, Lambda validates it, transforms it, and triggers downstream services.",
    govcloud: "Lambda runs inside your VPC for FedRAMP workloads. Use FIPS endpoints for SDK calls.",
    docs: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-govcloud.html",
  },
  "Amazon API Gateway": {
    what: "API Gateway is the front door for your application. It receives HTTPS requests, authenticates callers, and routes traffic to Lambda or other backends.",
    govcloud: "Use HTTP APIs with TLS 1.2+. Integrate with Cognito for auth.",
    docs: "https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html",
  },
  "Amazon DynamoDB": {
    what: "DynamoDB is a fast NoSQL database. Store document metadata (filename, upload time, status) for quick lookups without managing database servers.",
    govcloud: "Enable point-in-time recovery and encryption with KMS.",
    docs: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/",
  },
  "Amazon SQS": {
    what: "SQS is a message queue. When intake volume spikes, documents wait safely in the queue until processors are ready — preventing overload.",
    govcloud: "Use KMS-encrypted queues. Set visibility timeout longer than processing time.",
    docs: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/",
  },
  "AWS KMS": {
    what: "KMS manages encryption keys. Every encrypted S3 object, DynamoDB table, and SQS message uses a KMS key to protect data at rest.",
    govcloud: "KMS uses FIPS 140-2 validated hardware security modules in GovCloud.",
    docs: "https://docs.aws.amazon.com/kms/latest/developerguide/",
  },
  "Amazon CloudWatch": {
    what: "CloudWatch collects logs and metrics. Every API call and Lambda execution generates logs for audit trails and troubleshooting.",
    govcloud: "Required for FedRAMP audit evidence. Set log retention to 1 year minimum.",
    docs: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/",
  },
};

interface ServiceDetailPanelProps {
  service: ServiceNode;
  onClose: () => void;
}

export function ServiceDetailPanel({ service, onClose }: ServiceDetailPanelProps) {
  const info = SERVICE_LEARNING[service.data.service] ?? {
    what: service.data.description ?? "AWS managed service for your workload.",
    govcloud: "Verify availability and FIPS requirements in GovCloud documentation.",
    docs: service.data.docsUrl ?? "https://docs.aws.amazon.com/govcloud-us/",
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-outline-variant flex justify-between items-start">
        <div>
          <h3 className="font-display text-lg font-bold text-primary">{service.data.label}</h3>
          <p className="text-body-sm text-on-surface-variant">{service.data.service}</p>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <section>
          <h4 className="text-label-caps uppercase text-on-surface-variant mb-2">
            What happens here
          </h4>
          <p className="text-body-sm text-on-surface leading-relaxed">{info.what}</p>
        </section>

        <BackendVisualizer serviceName={service.data.service} />

        <section>
          <h4 className="text-label-caps uppercase text-on-surface-variant mb-2">
            GovCloud notes
          </h4>
          <p className="text-body-sm text-on-surface leading-relaxed">{info.govcloud}</p>
        </section>

        <a
          href={info.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-bold text-body-sm"
        >
          Official AWS docs
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </a>
      </div>
    </div>
  );
}
