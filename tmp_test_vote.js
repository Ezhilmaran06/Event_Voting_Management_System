(async ()=>{
  const base = 'http://localhost:3000';
  try{
    console.log('GET /events');
    let res = await fetch(`${base}/events`);
    console.log('status', res.status);
    let events = await res.json();
    console.log('events', events);

    console.log('\nGET /user_events');
    res = await fetch(`${base}/user_events`);
    console.log('status', res.status);
    let ues = await res.json();
    console.log('user_events', ues.slice(0,10));

    // pick first event and participant if available
    if (events && events.length>0 && ues && ues.length>0){
      const eventId = events[0].id;
      const participantId = ues[0].user_id;
      const payload = { eventId, participantId, voterId: ues[0].user_id };
      console.log('\nPOST /votes', payload);
      res = await fetch(`${base}/votes`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      console.log('status', res.status);
      const json = await res.json();
      console.log('resp', json);
    } else {
      console.log('No events or user_events to test votes with');
    }
  }catch(e){
    console.error('ERROR', e);
  }
})();
