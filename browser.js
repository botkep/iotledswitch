
// Sending messages, a simple POST
function PublishForm(form, url) {

  function sendMessage(message) {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  form.onsubmit = function () {
    sendMessage({ led_switch: 1});
    return false;
  };
}

// Receiving messages with long polling
function SubscribePane(elem, url) {

  function showMessage(message, form_bt) {
    if (message.led) {
      form_bt.style.backgroundColor = "red";
    } else {
      form_bt.style.backgroundColor = "gray";
    }
  }

  async function subscribe() {
    let response = await fetch(url);

    if (response.status == 502) {
      // Connection timeout
      // happens when the connection was pending for too long
      // let's reconnect
      await subscribe();
    } else if (response.status != 200) {
      // Show Error
      alert(response.statusText);
      // Reconnect in one second
      await new Promise(resolve => setTimeout(resolve, 1000));
      await subscribe();
    } else {
      // Got message
      let message = await response.text();
      showMessage(JSON.parse(message), elem);
      await subscribe();
    }
  }

  subscribe();

}