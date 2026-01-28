// Simple hook to send report requests to the backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5133';

export default function useReport() {
  const report = async ({ targetType, targetId, reason, details, token }) => {
    const body = { targetType, targetId, reason, details };
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      // Read body once as text, then try parse JSON safely
      const txt = await res.text();
      let message = txt;
      try {
        const data = JSON.parse(txt);
        message = data?.message || JSON.stringify(data);
      } catch (e) {
        // keep text
      }
      throw new Error(message || 'Failed to submit report');
    }

    // Success: parse JSON and return
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  };

  return { report };
}
