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

const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

const theme = {
  bg: isDark ? "#121212" : "#f5f5f5",
  card: isDark ? "#1e1e1e" : "white",
  text: isDark ? "#ffffff" : "#000000",
  subText: isDark ? "#aaaaaa" : "#666666",
};

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

  useEffect(() => {
  const resetAtNight = async () => {
    const now = new Date();

    // 今日の日付
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    // 21時以降だけ
    if (now.getHours() < 21) return;

    const resetRef = doc(db, "system", "reset");
    const resetSnap = await getDoc(resetRef);

    const lastReset = resetSnap.data()?.lastReset;

    // 今日すでにリセット済みなら終了
    if (lastReset === today) return;

    // 全部屋OFF
    for (const room of rooms) {
      await setDoc(doc(db, "rooms", room), {
        active: false,
      });
    }

    // 鍵返却
    await setDoc(doc(db, "key", "status"), {
      borrowed: false,
    });

    // ログ追加
    await addDoc(collection(db, "logs"), {
      text: "活動状況がリセットされました",
      time: new Date(),
    });

    // 今日リセットした記録
    await setDoc(resetRef, {
      lastReset: today,
    });
  };

  resetAtNight();
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

      await fetch("https://discordapp.com/api/webhooks/1501764757923954731/LfAp28fS8c7vwEVh8gx16OaiPq4yq-haLcJXv9L7sSeaY1QOYd6m2TDt3b_ppVCpyJ6R", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📢 ${name}が${target}を${
          newState ? "活動中" : "活動なし"
          }に変更しました`,
        }),
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

      await fetch("https://discordapp.com/api/webhooks/1501764757923954731/LfAp28fS8c7vwEVh8gx16OaiPq4yq-haLcJXv9L7sSeaY1QOYd6m2TDt3b_ppVCpyJ6R", {
      method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `🔑 ${name}が鍵を${
            newState ? "借りました" : "返却しました"
          }`,
        }),
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
    background: theme.bg,
    color: theme.text,
  },

  left: {
    width: "40%",
    padding: 15,
    background: theme.bg,
    overflowY: "auto",
  },

  right: {
    width: "60%",
    padding: 15,
    background: theme.bg,
    overflowY: "auto",
  },

  card: {
    background: theme.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },

  title: {
    fontWeight: "bold",
    fontSize: 16,
    color: theme.text,
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
  },

  log: {
    borderBottom: `1px solid ${theme.subText}`,
    padding: "10px 0",
  },

  time: {
    fontSize: 12,
    color: theme.subText,
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