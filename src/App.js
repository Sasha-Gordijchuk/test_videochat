import React, { useRef, useState, useEffect } from "react";

const WebRTCComponent = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const connectionRef = useRef(null);
  const ws = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [allMediaDevices, setAllMediaDevices] = useState();
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");

  useEffect(() => {
    const getMediaDevices = async () => {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput");
      const audioDevices = allDevices.filter((device) => device.kind === "audioinput");

      setDevices({ video: videoDevices, audio: audioDevices });
      if (videoDevices.length > 0) setSelectedVideoDevice(videoDevices[0].deviceId);
      if (audioDevices.length > 0) setSelectedAudioDevice(audioDevices[0].deviceId);
    };

    getMediaDevices();

    const handleDeviceChange = () => {
      getMediaDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

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
            setIsConnected(true);
            break;

          case "answer":
            await connectionRef.current.setRemoteDescription(data.answer);
            console.log("[WebRTC] Remote answer set");
            setIsConnected(true);
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
    connectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    connectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
        console.log("[WebRTC] ICE Candidate sent");
      }
    };

    connectionRef.current.ontrack = (event) => {
      console.log("[WebRTC] Remote stream received");
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return () => {
      connectionRef.current.close();
    };
  }, []);

  

  const startStream = async () => {
    const constraints = {
      video: { deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined },
      audio: { deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => {
        connectionRef.current.addTrack(track, stream);
      });
      console.log("[WebRTC] Local stream added");
    } catch (error) {
      console.error("[WebRTC] Error accessing media devices:", error);
    }
  };

  const createOffer = async () => {
    const offer = await connectionRef.current.createOffer();
    await connectionRef.current.setLocalDescription(offer);
    ws.current.send(JSON.stringify({ type: "offer", offer }));
    console.log("[WebRTC] Offer sent");
  };

  const endCall = () => {
    if (localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      remoteVideoRef.current.srcObject = null;
    }

    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
    }

    setIsConnected(false);
    console.log("[WebRTC] Call ended");
  };

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <div>
        <label>
          Camera:
          <select
            value={selectedVideoDevice}
            onChange={(e) => setSelectedVideoDevice(e.target.value)}
          >
            {devices.video.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "Camera " + device.deviceId}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Microphone:
          <select
            value={selectedAudioDevice}
            onChange={(e) => setSelectedAudioDevice(e.target.value)}
          >
            {devices.audio.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "Microphone " + device.deviceId}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: "20px", flexWrap: 'wrap' }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          style={{
            width: "300px",
            height: "200px",
            backgroundColor: "black",
          }}
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          style={{
            width: "300px",
            height: "200px",
            backgroundColor: "black",
          }}
        ></video>
      </div>
      <button onClick={startStream} disabled={isConnected}>
        Start Stream
      </button>
      <button onClick={createOffer} disabled={isConnected}>
        Start Call
      </button>
      <button onClick={endCall} disabled={!isConnected}>
        End Call
      </button>
    </div>
  );
};

export default WebRTCComponent;
