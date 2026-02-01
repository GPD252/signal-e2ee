let pc;
let localStream;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

export async function startCall(ws) {
  pc = new RTCPeerConnection(config);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localStream.getTracks().forEach(track =>
    pc.addTrack(track, localStream)
  );

  document.getElementById("local").srcObject = localStream;

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      ws.send(JSON.stringify({
        type: "ice",
        candidate: e.candidate
      }));
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  ws.send(JSON.stringify({
    type: "offer",
    offer
  }));
}

export async function handleSignal(data, ws) {
  if (!pc) {
    pc = new RTCPeerConnection(config);

    pc.ontrack = e => {
      document.getElementById("remote").srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        ws.send(JSON.stringify({
          type: "ice",
          candidate: e.candidate
        }));
      }
    };
  }

  if (data.offer) {
    await pc.setRemoteDescription(data.offer);

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localStream.getTracks().forEach(track =>
      pc.addTrack(track, localStream)
    );

    document.getElementById("local").srcObject = localStream;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    ws.send(JSON.stringify({
      type: "answer",
      answer
    }));
  }

  if (data.answer) {
    await pc.setRemoteDescription(data.answer);
  }

  if (data.candidate) {
    await pc.addIceCandidate(data.candidate);
  }
}
