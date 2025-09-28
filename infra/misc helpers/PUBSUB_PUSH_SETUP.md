# Pub/Sub push → Cloud Run (worker) with OIDC

```bash
PROJECT=<your-project-id>
REGION=us-central1
WORKER_URL=$(gcloud run services describe worker --region $REGION --format="value(status.url)")

gcloud pubsub topics create process-file || true

gcloud pubsub subscriptions create process-file-sub \
  --topic=process-file \
  --push-endpoint="${WORKER_URL}/pubsub" \
  --push-auth-service-account="pubsub-push@${PROJECT}.iam.gserviceaccount.com" \
  --push-auth-token-audience="${WORKER_URL}/pubsub"

gcloud run services add-iam-policy-binding worker \
  --region $REGION \
  --member="serviceAccount:pubsub-push@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```
