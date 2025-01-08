import React, { useRef, useState, useEffect } from "react";

const WebRTCComponent = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const connectionRef = useRef(null);
  const ws = useRef(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    ws.current = new WebSocket("https://ws-server-trmz.onrender.com");

    ws.current.onopen = () => {
      console.log("[WebSocket] Connected to signaling server");
    };

    ws.current.onmessage = async (message) => {
      if (message.data instanceof Blob) {
        const blob = message.data;
        const blobData = await blob.text();
        const data = JSON.parse(blobData);

        console.log("[WebSocket] Received message:", data);

        switch (data.type) {
          case "offer":
            await connectionRef.current.setRemoteDescription(data.offer);
            const answer = await connectionRef.current.createAnswer();
            await connectionRef.current.setLocalDescription(answer);
            ws.current.send(JSON.stringify({ type: "answer", answer }));
            console.log("[WebRTC] Answer sent");
            break;
  
          case "answer":
            await connectionRef.current.setRemoteDescription(data.answer);
            console.log("[WebRTC] Remote answer set");
            break;
  
          case "iceCandidate":
            try {
              await connectionRef.current.addIceCandidate(data.candidate);
              console.log("[WebRTC] ICE Candidate added");
            } catch (error) {
              console.error("[WebRTC] Error adding ICE Candidate:", error);
            }
            break;

          default:
            console.log("[WebSocket] Unknown message type");
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    return () => {
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    // Ініціалізація PeerConnection
    connectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    connectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
        console.log("[WebRTC] ICE Candidate sent");
      }
    };

    connectionRef.current.ontrack = (event) => {
      console.log("[WebRTC] Remote stream received");
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    console.log('navigator');
    console.log(navigator);
    

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          connectionRef.current.addTrack(track, stream);
        });
        console.log("[WebRTC] Local stream added");
      })
      .catch((error) => console.error("[WebRTC] Error accessing media devices:", error));

    return () => {
      connectionRef.current.close();
    };
  }, []);

  const createOffer = async () => {
    const offer = await connectionRef.current.createOffer();
    await connectionRef.current.setLocalDescription(offer);
    ws.current.send(JSON.stringify({ type: "offer", offer }));
    console.log("[WebRTC] Offer sent");
  };

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <video ref={localVideoRef} autoPlay muted style={{ width: "300px", height: "200px", backgroundColor: "black" }}></video>
        <video ref={remoteVideoRef} autoPlay style={{ width: "300px", height: "200px", backgroundColor: "black" }}></video>
      </div>
      <button onClick={createOffer} disabled={isConnected}>
        Start Call
      </button>
    </div>
  );
};

export default WebRTCComponent;
