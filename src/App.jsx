import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

const rooms = ["多目的室", "会議室2", "会議室3", "NCUホール", "部室"];

export default function App() {
  const [roomStates, setRoomStates] = useState({});
  const [keyState, setKeyState] = useState(false);
  const [logs, setLogs] = useState([]);

  // 部屋
  useEffect(() => {
    const unsubs = rooms.map((room) =>
      onSnapshot(doc(db, "rooms", room), (snap) => {
        setRoomStates((prev) => ({
          ...prev,
          [room]: snap.data()?.active || false,
        }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  // 鍵
  useEffect(() => {
    return onSnapshot(doc(db, "key", "status"), (snap) => {
      setKeyState(snap.data()?.borrowed || false);
    });
  }, []);

  // ログ
  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("time", "desc"));
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => d.data()));
    });
  }, []);

  const handleChange = async (type, target) => {
    const name = prompt("名前を入力してください");
    const pass = prompt("パスワードを入力してください");

    if (pass !== "0331") return alert("パスワードが違います");

    if (type === "room") {
      const newState = !roomStates[target];

      await setDoc(doc(db, "rooms", target), {
        active: newState,
      });

      await addDoc(collection(db, "logs"), {
        text: `${name}が${target}を${
          newState ? "活動中" : "活動なし"
        }に変更しました`,
        time: new Date(),
      });
    }

    if (type === "key") {
      const newState = !keyState;

      await setDoc(doc(db, "key", "status"), {
        borrowed: newState,
      });

      await addDoc(collection(db, "logs"), {
        text: `${name}が鍵を${newState ? "借りました" : "返却しました"}`,
        time: new Date(),
      });
    }
  };

  return (
    <div style={styles.container}>
      {/* 左 */}
      <div style={styles.left}>
        <h2>活動状況</h2>

        {rooms.map((room) => (
          <div key={room} style={styles.card}>
            <div style={styles.title}>{room}</div>

            <div
              style={{
                ...styles.status,
                color: roomStates[room] ? "green" : "gray",
              }}
            >
              ● {roomStates[room] ? "活動中" : "活動なし"}
            </div>

            <button
              style={styles.button}
              onClick={() => handleChange("room", room)}
            >
              切替
            </button>
          </div>
        ))}

        <h2>鍵</h2>
        <div style={styles.card}>
          <div
            style={{
              ...styles.status,
              color: keyState ? "red" : "blue",
            }}
          >
            ● {keyState ? "借りている" : "借りていない"}
          </div>

          <button style={styles.button} onClick={() => handleChange("key")}>
            切替
          </button>
        </div>
      </div>

      {/* 右 */}
      <div style={styles.right}>
        <h2>ログ</h2>

        {logs.map((log, i) => (
          <div key={i} style={styles.log}>
            <div>{log.text}</div>
            <div style={styles.time}>
              {log.time?.toDate?.().toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "sans-serif",
    flexDirection: "row",
  },

  left: {
    width: "40%",
    padding: 15,
    background: "#f5f5f5",
    overflowY: "auto",
  },

  right: {
    width: "60%",
    padding: 15,
    overflowY: "auto",
  },

  card: {
    background: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },

  title: {
    fontWeight: "bold",
    fontSize: 16,
  },

  status: {
    margin: "5px 0",
    fontSize: 14,
  },

  button: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    background: "#007bff",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },

  log: {
    borderBottom: "1px solid #ddd",
    padding: "10px 0",
  },

  time: {
    fontSize: 12,
    color: "gray",
  },
};

// スマホ対応
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@media (max-width: 768px) {
  div[style*="display: flex"] {
    flex-direction: column !important;
  }
  div[style*="width: 40%"],
  div[style*="width: 60%"] {
    width: 100% !important;
  }
}
`;
document.head.appendChild(styleSheet);