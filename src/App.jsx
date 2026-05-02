import { useEffect, useState } from "react";

const ROOMS = [
  "多目的室",
  "会議室2",
  "会議室3",
  "NCUホール",
  "部室",
];

const PASSWORD = "0331";

export default function App() {
  const [roomStatus, setRoomStatus] = useState({});
  const [keyStatus, setKeyStatus] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const savedRooms = localStorage.getItem("room-status");
    const savedKey = localStorage.getItem("key-status");
    const savedLogs = localStorage.getItem("logs");

    if (savedRooms) {
      setRoomStatus(JSON.parse(savedRooms));
    } else {
      const init = {};
      ROOMS.forEach((r) => (init[r] = false));
      setRoomStatus(init);
    }

    if (savedKey) setKeyStatus(JSON.parse(savedKey));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem("room-status", JSON.stringify(roomStatus));
  }, [roomStatus]);

  useEffect(() => {
    localStorage.setItem("key-status", JSON.stringify(keyStatus));
  }, [keyStatus]);

  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  const addLog = (text) => {
    const time = new Date().toLocaleString();

    setLogs((prev) => {
      const newLogs = [{ text, time }, ...prev];
      return newLogs.slice(0, 100);
    });
  };

  const toggleRoom = (room) => {
    const name = prompt("名前を入力してください");
    if (!name) return;

    const pass = prompt("パスワードを入力してください");
    if (pass !== PASSWORD) {
      alert("パスワードが違います");
      return;
    }

    setRoomStatus((prev) => {
      const next = !prev[room];
      addLog(
        `${name}が${room}を${next ? "活動中" : "活動なし"}に変更しました`
      );
      return { ...prev, [room]: next };
    });
  };

  const toggleKey = () => {
    const name = prompt("名前を入力してください");
    if (!name) return;

    const pass = prompt("パスワードを入力してください");
    if (pass !== PASSWORD) {
      alert("パスワードが違います");
      return;
    }

    setKeyStatus((prev) => {
      const next = !prev;
      addLog(`${name}が鍵を${next ? "借りました" : "返却しました"}`);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* LEFT */}
      <div style={{ flex: 1, padding: 20, borderRight: "1px solid #ddd" }}>
        <h2>活動状況</h2>

        {ROOMS.map((room) => {
          const active = roomStatus[room];
          return (
            <div
              key={room}
              onClick={() => toggleRoom(room)}
              style={{
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                cursor: "pointer",
                background: active ? "#22c55e" : "#ef4444",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>{room}</span>
              <span>{active ? "活動中" : "活動なし"}</span>
            </div>
          );
        })}

        <h2 style={{ marginTop: 30 }}>鍵管理</h2>
        <div
          onClick={toggleKey}
          style={{
            padding: 12,
            borderRadius: 8,
            cursor: "pointer",
            background: keyStatus ? "#3b82f6" : "#9ca3af",
            color: "white",
            fontWeight: "bold",
          }}
        >
          {keyStatus ? "鍵：借りている" : "鍵：借りていない"}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ width: 420, padding: 20, overflowY: "auto" }}>
        <h2>ログ</h2>

        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: 10, fontSize: 14 }}>
            <div>{log.text}</div>
            <div style={{ fontSize: 12, color: "gray" }}>{log.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
