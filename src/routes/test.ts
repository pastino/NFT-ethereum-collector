const { parentPort, workerData, isMainThread } = require("worker_threads");

export function getRandomNumber() {
  const randomNumber = Math.floor(Math.random() * 11 - 0);
  return randomNumber;
}

if (!isMainThread) {
  for (let i = 0; i < 10; i++) {
    parentPort?.postMessage(getRandomNumber());
  }
}

// const receiveWorker = new Worker(__dirname + "/test.ts");
// receiveWorker.on("message", (msg) => {
//   console.log("a message is sent! : ", msg);
// });

// receiveWorker.on("error", (err) => {
//   console.error(err);
// });

// receiveWorker.on("exit", () => console.log("exited!"));
