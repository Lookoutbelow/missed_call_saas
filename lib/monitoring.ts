type ErrorContext = Record<string, unknown>;

export async function captureError(error: unknown, context?: ErrorContext) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Monitoring error:", message, context ?? {});

  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint) {
    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        level: "error",
        message,
        context
      })
    });
  } catch (monitoringError) {
    console.error("Monitoring hook failed:", monitoringError);
  }
}

export async function captureMessage(message: string, context?: ErrorContext) {
  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint) {
    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        level: "info",
        message,
        context
      })
    });
  } catch (monitoringError) {
    console.error("Monitoring hook failed:", monitoringError);
  }
}
