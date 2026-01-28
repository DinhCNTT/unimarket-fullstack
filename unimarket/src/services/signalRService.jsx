import * as signalR from "@microsoft/signalr";

const hubUrl = "http://localhost:5133/hub/chat";

class SignalRService {
  constructor() {
    this.connection = null;
    this.connected = false;
    this.startPromise = null;
    this._lastToken = localStorage.getItem("token") || "";
    this._eventQueue = []; // lưu event khi chưa có connection

    // Theo dõi token thay đổi
    window.addEventListener("storage", (e) => {
      if (e.key === "token" && e.newValue !== this._lastToken) {
        this._lastToken = e.newValue;
        this._reconnectWithNewToken();
      }
    });
  }

  async _reconnectWithNewToken() {
    await this.stop();
    await this.start();
  }

  async start() {
    if (this.connection && this.connected) return;
    if (this.startPromise) return this.startPromise;

    this._lastToken = localStorage.getItem("token");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onclose(() => {
      this.connected = false;
      console.log("❌ SignalR connection closed");
    });

    // gắn lại tất cả event handler từ queue
    this._eventQueue.forEach(({ eventName, callback }) => {
      this.connection.on(eventName, callback);
    });

    this.startPromise = this.connection
      .start()
      .then(() => {
        this.connected = true;
        console.log("✅ SignalR connected");
      })
      .catch((error) => {
        this.connected = false;
        this.connection = null;
        console.error("❌ SignalR connection failed", error);

        // thử reconnect sau 3s
        setTimeout(() => this.start(), 3000);
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("🛑 SignalR stopped");
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }
    this.connected = false;
    this.connection = null;
    this.startPromise = null;
  }

  on(eventName, callback) {
    if (this.connection) {
      this.connection.on(eventName, callback);
    }
    // luôn lưu event vào queue để dùng lại khi reconnect
    this._eventQueue.push({ eventName, callback });
  }

  off(eventName, callback) {
    if (this.connection) {
      this.connection.off(eventName, callback);
    }
    // xóa trong queue
    this._eventQueue = this._eventQueue.filter(
      (e) => e.eventName !== eventName || e.callback !== callback
    );
  }

  async invoke(methodName, ...args) {
    if (!this.connection) {
      console.warn("⚠️ No SignalR connection to invoke");
      return;
    }

    if (this.startPromise) await this.startPromise;

    const waitConnected = () =>
      new Promise((resolve, reject) => {
        const maxWait = 5000;
        const interval = 50;
        let waited = 0;

        const check = () => {
          if (this.connected) resolve();
          else {
            waited += interval;
            if (waited >= maxWait) reject(new Error("Timeout waiting for SignalR connect"));
            else setTimeout(check, interval);
          }
        };
        check();
      });

    try {
      await waitConnected();
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`❌ Error invoking ${methodName}:`, error);
    }
  }
}

const signalRService = new SignalRService();
export default signalRService;
