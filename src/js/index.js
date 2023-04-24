import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

if (ExecutionEnvironment.canUseDOM) {
  const aDOM = document.getElementById("beian");
  if (aDOM) {
    if (location.hostname === "supercodepower.com") {
      aDOM.innerText = "晋ICP备19004813号-2";
    } else {
      // skychx.com
      aDOM.innerText = "晋ICP备19004813号-3";
    }
  }
}
