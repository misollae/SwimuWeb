function requestFile(){
    console.log('Hi')
    let file_name = document.getElementById('file_name').value
    let payload = { file_name : file_name }

    fetch('http://localhost:3000/SwimuWeb', {
      method: "POST",
      headers: {
        Accept: 'application.json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
      })
}
