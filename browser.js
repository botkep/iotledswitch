const led_bt = document.getElementById("submit_bt");
const submit = document.getElementById("submit");

let state = {
  led: 0
};

window.onload = () => {
  subscribe();
  window.setTimeout(function () {
    post({ led_switch: 0, update: 1 });
    renderbt();
  }, 200);
}

function renderbt() {
  if (state.led) {
    led_bt.style.backgroundColor = "red";
  } else {
    led_bt.style.backgroundColor = "gray";
  }
}

function post(json) {
  fetch('publish', {
    method: 'POST',
    body: JSON.stringify(json)
  });
}

submit.onsubmit = function (event) {
  event.preventDefault();
  post({ led_switch: 1, update: 0 });
};

async function subscribe() {
  let response = await fetch('subscribe?random=' + Math.random());
  if (response.status == 502) {
    await subscribe();
  } else if (response.status != 200) {
    alert(response.statusText);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await subscribe();
  } else {
    let message = JSON.parse(await response.text());
    state.led = message.led;
    renderbt();
    await subscribe();
  }
}

