import performance_rnn from "./performance_rnn";
import vrmDisplay from "./vrmDisplay";

const btnStart = document.getElementById("btn_start");

btnStart.addEventListener("click", function () {
    //performance_rnn()
    vrmDisplay()
    btnStart.classList.add("close")
});


