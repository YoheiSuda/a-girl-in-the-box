import vrmDisplay from "./vrmDisplay";

const btnStart = document.getElementById("btn_start");
const loading = document.getElementById("loading");

btnStart.addEventListener("click", function () {
    loading.classList.add("on");
    btnStart.classList.add("close");
    vrmDisplay()
});


