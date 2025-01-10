import React, { useEffect, useRef, useState } from "react";

const VideoChat = () => {
  const [wsConnection, setWsConnection] = useState(null);
  const [transport, setTransport] = useState(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const videoRef = useRef(null);

  const connectToServer = async () => {
    const socket = new WebSocket("ws://localhost:8080");
    setWsConnection(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "info":
          console.log(message.message);
          break;
        case "newTransport":
          createWebRtcTransport(message.data, socket);
          break;
        default:
          break;
      }
    };
  }

  const createWebRtcTransport = async (options, socket) => {
    // Створення WebRTC транспортного потоку за допомогою MediaSoup
    const transportOptions = {
      id: options.internal.transportId,
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const rtcTransport = new RTCPeerConnection(transportOptions);

    setTransport(rtcTransport);

    // Додаємо медіа потоки (відео/аудіо)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    rtcTransport.addTrack(videoTrack);
    rtcTransport.addTrack(audioTrack);

    console.log(rtcTransport);
    

    videoRef.current.srcObject = stream;

    // Надсилаємо сигнал про наявність відео
    socket.send(
      JSON.stringify({
        type: "produce",
        data: {
          transportId: options.id,
          track: videoTrack,
          kind: "video"
        },
      })
    );
  };

  const joinRoom = () => {
    wsConnection.send(JSON.stringify({ type: "joinRoom", data: {} }));
    setRoomJoined(true);
  };

  return (
    <div>
      <h1>Video Chat</h1>
      {roomJoined ? (
        <div>
          <video ref={videoRef} autoPlay />
          {/* Інші учасники будуть відображатись тут */}
        </div>
      ) : (
        <div>
          <button onClick={joinRoom}>Join Room</button>
          <button onClick={connectToServer}>Connect</button>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
