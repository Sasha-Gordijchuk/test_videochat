import React, { useEffect, useState, useRef } from "react";
import WebRTCComponent from "./components/WebRTCComponent";

const connectDevices = () => {
  const [isLogined, setIsLogined] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const localVideoRef = useRef(null);
  const [devices, setDevices] = useState({
    video: [],
    audio: [],
  });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");

  const Login = (isItitiator) => {
    setIsLogined(true);
    setIsInitiator(isItitiator);
  };

  const handleSetDevices = async () => {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const allDevices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = allDevices.filter(
      (device) => device.kind === "videoinput"
    );
    const audioDevices = allDevices.filter(
      (device) => device.kind === "audioinput"
    );

    setDevices({
      video: videoDevices,
      audio: audioDevices,
    });

    if (videoDevices.length > 0) {
      setSelectedVideoDevice(videoDevices[0].deviceId);
    }

    if (audioDevices.length > 0) {
      setSelectedAudioDevice(audioDevices[0].deviceId);
    }

    const constraints = {
      video: {
        deviceId: selectedVideoDevice
          ? { exact: selectedVideoDevice }
          : undefined,
      },
      audio: {
        deviceId: selectedAudioDevice
          ? { exact: selectedAudioDevice }
          : undefined,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideoRef.current.srcObject = stream;
  };

  useEffect(() => {
    handleSetDevices();
  }, []);

  return (
    <div
      style={{
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <button style={{ padding: "8px" }} onClick={() => Login(true)}>
            Login as Initiator
          </button>
          <button style={{ padding: "8px" }} onClick={() => Login(false)}>
            Login as Guest
          </button>
        </div>

        {/* selectors */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
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
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
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
        {isLogined && <WebRTCComponent isInitiator={isInitiator} />}
      </div>
    </div>
  );

  // return isLogined ? (
  //   <div>
  //     <WebRTCComponent
  //       isInitiator={isInitiator}
  //       devices={{
  //         audio: selectedAudioDevice,
  //         video: selectedVideoDevice,
  //       }}
  //     />
  //   </div>
  // ) : (
  //   <div
  //     style={{
  //       padding: "40px",
  //     }}
  //   >
  //     <div
  //       style={{
  //         display: "flex",
  //         gap: "16px",
  //         marginBottom: "16px",
  //         flexWrap: "wrap",
  //       }}
  //     >
  //       <video
  //         ref={localVideoRef}
  //         autoPlay
  //         muted
  //         style={{
  //           width: "300px",
  //           height: "200px",
  //           backgroundColor: "black",
  //         }}
  //       ></video>

  //       <div
  //         style={{
  //           display: "flex",
  //           flexDirection: "column",
  //           gap: "8px",
  //         }}
  //       >
  //         <div>
  //           <label>
  //             Camera:
  //             <select
  //               value={selectedVideoDevice}
  //               onChange={(e) => setSelectedVideoDevice(e.target.value)}
  //             >
  //               {devices.video.map((device) => (
  //                 <option key={device.deviceId} value={device.deviceId}>
  //                   {device.label || "Camera " + device.deviceId}
  //                 </option>
  //               ))}
  //             </select>
  //           </label>
  //         </div>
  //         <div>
  //           <label>
  //             Microphone:
  //             <select
  //               value={selectedAudioDevice}
  //               onChange={(e) => setSelectedAudioDevice(e.target.value)}
  //             >
  //               {devices.audio.map((device) => (
  //                 <option key={device.deviceId} value={device.deviceId}>
  //                   {device.label || "Microphone " + device.deviceId}
  //                 </option>
  //               ))}
  //             </select>
  //           </label>
  //         </div>
  //       </div>
  //     </div>

  //     <div
  //       style={{
  //         display: "flex",
  //         gap: "16px",
  //       }}
  //     >
  //       <button style={{ padding: "8px" }} onClick={() => Login(true)}>
  //         Login as Initiator
  //       </button>
  //       <button style={{ padding: "8px" }} onClick={() => Login(false)}>
  //         Login as Guest
  //       </button>
  //     </div>
  //   </div>
  // );
};

export default connectDevices;
