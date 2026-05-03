import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy
} from "firebase/firestore";

const rooms = ["多目的室", "会議室2", "会議室3", "NCUホール", "部室"];

export default function App() {
  const [roomStates, setRoomStates] = useState({});
  const [keyState, setKeyState] = useState(false);
  const [logs, setLogs] = useState([]);

  // リアルタイム取得（部屋）
  useEffect(() => {
    const unsubscribers = rooms.map((room) =>
      onSnapshot(doc(db, "rooms", room), (snap) => {
        setRoomStates((prev) => ({
          ...prev,
          [room]: snap.data()?.active || false
        }));
      })
    );
    return () => unsubscribers.forEach((u) => u());
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
      setLogs(snap.docs.map((doc) => doc.data()));
    });
  }, []);

  const handleChange = async (type, target) => {
    const name = prompt("名前を入力");
    const pass = prompt("パスワードを入力");

    if (pass !== "0331") {
      alert("パスワードが違います");
      return;
    }

    if (type === "room") {
      const newState = !roomStates[target];
      await setDoc(doc(db, "rooms", target), { active: newState });

      await addDoc(collection(db, "logs"), {
        text: `${name}が${target}を${newState ? "活動中" : "活動なし"}に変更`,
        time: new Date()
      });
    }

    if (type === "key") {
      const newState = !keyState;
      await setDoc(doc(db, "key", "status"), { borrowed: newState });

      await addDoc(collection(db, "logs"), {
        text: `${name}が鍵を${newState ? "借りました" : "返却しました"}`,
        time: new Date()
      });
    }
  };

  return (
    <div style={{ display: "flex", padding: 20 }}>
      {/* 左 */}
      <div style={{ width: "40%" }}>
        <h2>活動状況</h2>
        {rooms.map((room) => (
          <div key={room}>
            <b>{room}</b>：
            <span style={{ color: roomStates[room] ? "green" : "gray" }}>
              {roomStates[room] ? " 活動中" : " 活動なし"}
            </span>
            <button onClick={() => handleChange("room", room)}>
              切替
            </button>
          </div>
        ))}

        <h2>鍵</h2>
        <div>
          状態：
          <span style={{ color: keyState ? "red" : "blue" }}>
            {keyState ? " 借りている" : " 借りていない"}
          </span>
          <button onClick={() => handleChange("key")}>切替</button>
        </div>
      </div>

      {/* 右 */}
      <div style={{ width: "60%" }}>
        <h2>ログ</h2>
        {logs.map((log, i) => (
          <div key={i}>
            {log.text}（{log.time?.toDate?.().toLocaleString()}）
          </div>
        ))}
      </div>
    </div>
  );
}