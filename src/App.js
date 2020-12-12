import './App.css';
import Unity, { UnityContext } from "react-unity-webgl";
import React from "react";
import CanvasJSReact from './lib/canvasjs.react';
const CanvasJS = CanvasJSReact.CanvasJS;

const TAG = "App.js";

function getQueryVariable(variable)
{
  const query = window.location.search.substring(1);
  const vars = query.split("&");
  for (let i=0; i<vars.length; i++) {
    const pair = vars[i].split("=");
    if(pair[0] === variable){return pair[1];}
  }
  return false;
}

// Thanks to https://codepen.io/rstamper/pen/mdyqyeM for his Loading bar. (I was to lazy to do one.)
// Thanks to https://github.com/elraccoone/react-unity-webgl for the wonderful library they made.
export default class App extends React.Component {

  constructor(props)
  {
    super(props);

    this.state = {
      mounted:false,
      loaded:false,
      loading_title:"Loading",
      progress:"0%",
      loading_description:"This can take some time depending on your connection...",
      chartData:"",
      requireData:false,
      easterEggs: getQueryVariable('conga'),
    }

    // Utils functions
    this.setProgress = this.setProgress.bind(this);
    this.createChart = this.createChart.bind(this);
    this.getStackOverflowData = this.getStackOverflowData.bind(this);
    this.sendStackOverflowData = this.sendStackOverflowData.bind(this);
    this.HandleEasterEggs = this.HandleEasterEggs.bind(this);

    // Unity progress
    this.unityContext = new UnityContext({
      loaderUrl: "unity/build.loader.js",
      dataUrl: "unity/build.data",
      frameworkUrl: "unity/build.framework.js",
      codeUrl: "unity/build.wasm",
    });

    // Create a new listener for our progression Event.
    this.unityContext.on("progress", progression => {
      // Now we can use the progression to for example
      // display it on our React app.
      console.log("[PROGRESS] " + progression);
      this.setProgress(progression);
      this.setState({progress:Math.round(progression*100) + "%"})
    });

    // Create a new listener for the loaded event.
    this.unityContext.on('loaded', () => {
      console.log("[" + TAG + "] [PROGRESS] COMPLETE");
      this.setState({loaded:true})
    });

    // Communication Unity -> React
    this.unityContext.on("RequireData", (value) => {

      console.log("[" + TAG + "] RequireData " + value);
      this.setState({requireData:true}, () => {
        this.sendStackOverflowData();
        this.HandleEasterEggs();
      });
    });

    // Fetch the needed data
    this.getStackOverflowData();


  }

  HandleEasterEggs()
  {
    if(this.state.easterEggs)
    {
      console.log("[" + TAG + "] easterEggs detected");
      this.unityContext.send(
          "AudioController",
          "SetAudio",
          0);
    }
  }

  // Send to unity the data.
  sendStackOverflowData()
  {
    console.log("[" + TAG + "] Sending data");

      this.unityContext.send(
          "BoardController",
          "SetImageFromBase64",
          this.state.chartData);
  }

  getStackOverflowData()
  {
    fetch('https://api.stackexchange.com/2.2/users/10160890/reputation?fromdate=1577836800&site=stackoverflow')
        .then(
            function(response) {
              if (response.status !== 200) {
                console.log('[' + TAG + '] Looks like there was a problem. Status Code: ' +
                    response.status);
                return;
              }
              // Examine the text in the response
              response.json().then(function(data) {
                console.log("["+ TAG + "] Data fetched");

                let dataPoints = [];
                let reputation = 0;
                for(let i = data.items.length - 1 ; i > 0 ; i--)
                {
                  reputation += data.items[i].reputation_change;
                  dataPoints.push({x:new Date(data.items[i].on_date * 1000),y:reputation});
                }
                dataPoints.push({x:Date.now(),y:reputation}); //See todays reputation

                this.setState({chartData:this.createChart(dataPoints)}, () => {

                  //It seems that we need the data we just fetched, the Unity loading was too fast.
                  if(this.state.requireData && this.state.loaded)
                    this.sendStackOverflowData();

                })
                console.log(dataPoints);
              }.bind(this));
            }.bind(this)
        )
        .catch(function(err) {
          console.log('[' + TAG + '] Fetch Error :-S', err);
        });
  }


  componentDidMount()
  {
    this.setState({mounted:true});
    this.setProgress();
  }

  // Set the progress of the loading bar
  setProgress(value)
  {
    if(!this.state.mounted || this.state.loaded)
      return;
    const progress = document.querySelector('.progress-done');
    progress.style.width = Math.round(value*100) + '%';
    progress.style.opacity = 1;
  }

  createChart(dataPoints)
  {
    let canvas = document.createElement('canvas');
    let chart = new CanvasJS.Chart(canvas, {
      theme: "dark1",
      backgroundColor: "#FFFFF000",
      title:{
        text: "REPUTATION",
        fontSize:"40",
        fontFamily:"Calibri",
        fontWeight:"bold",
        fontColor:"grey"
      },
      axisY:{
        tickLength: 10,
        gridColor:"transparent",
        lineColor: "grey",
        labelFontColor: "grey"
      },
      axisX:{
        lineThickness: 1,
        lineColor: "grey",
        labelFontColor: "grey",
        gridColor:"transparent"
      },
      width:300,
      height:300,
      data: [
        {
          markerSize:3,
          type: "spline",
          dataPoints: dataPoints  }
      ]
    });
    chart.render();
    return chart.exportChart({format: "png",toDataURL:true});
  }

  render() {
    return <div style={{width:"100%",height:"100%",textAlign:"center"}}>
      {!this.state.loaded?<div>
        <h1>{this.state.loading_title}</h1>
        {this.state.loading_description}<br /><br />
        <div className={"progress"} style={{margin:"auto"}}>
          <div className={"progress-done"}>
            {this.state.progress}
          </div>
        </div>
      </div>:<></>}
      <Unity className={"unity-container"} width="100%" height="100%" unityContext={this.unityContext} />
      <button onClick={this.sendStackOverflowData}></button>
    </div>;
  }


}

