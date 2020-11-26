import logo from './logo.svg';
import './App.css';
import Unity, { UnityContext } from "react-unity-webgl";
import React from "react";

const unityContext = new UnityContext({
  loaderUrl: "unity/build.loader.js",
  dataUrl: "unity/build.data",
  frameworkUrl: "unity/build.framework.js",
  codeUrl: "unity/build.wasm",
});

function App() {
  return <Unity className={"unity-container"} width="100%" height="100%" unityContext={unityContext} />;
}

export default App;
