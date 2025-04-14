;(async () => {
  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Runtime                                                                                       │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const PLAY_DURATION = 5100 // in ms. Arbitrary number to make the page feeling alive by playing videos for some seconds
  const timestamps = {}
  const params = new URLSearchParams(document.location.search)
  const preset = params.get('preset') || 'adless'
  const id = params.get('id') || preset === 'adless' ? 'x136j6' : 'x15doe'

  init()
  run()
  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Declarations                                                                                  │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  function init() {
    // Autoreload on preset change
    const node = document.querySelector('#preset')
    node.value = preset
    node.addEventListener('change', () => {
      const url = new URL(location.href)
      url.searchParams.set('preset', node.value)
      document.location.href = url
    })
    // Init label
    document.querySelector('#metric-label').innerHTML =
      preset === 'adless' ? 'Time to TTFF' : 'Time to impression'
  }

  function saveTimestamp(name) {
    timestamps[name] = Math.round(Date.now() - performance.timeOrigin) // Save timestamp in upper scope for later usage
    document.querySelector('#step').innerHTML = `Saving <code>${name}</code> timestamp ...`
    document.querySelector('#logs').innerHTML += `<div class="log-row">
        <span><code>${name}</code></span>
        <span class="font-mono">${timestamps[name]}ms</span>
      </div>`
  }

  async function dmLoadScript() {
    saveTimestamp('dm_script_start')
    return new Promise((resolve) => {
      const onload = () => {
        saveTimestamp('dm_script_end')
        resolve()
      }
      const script = document.createElement('script')
      script.src = `https://geo.dailymotion.com/libs/player/${id}.js`
      document.querySelector('#dm-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onload
      document.head.appendChild(script)
    })
  }

  async function dmStartPreroll() {
    saveTimestamp('dm_player_start')
    return new Promise(async (resolve) => {
      const player = await dailymotion.createPlayer('dm-player', {
        video: 'x9hnw4q',
        params: {
          customConfig: {
            adurl:
              'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=[CACHEBUSTING]',
          },
        },
      })
      player.on(
        dailymotion.events.AD_IMPRESSION,
        () => {
          saveTimestamp('dm_metric_end')
          setTimeout(player.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  async function dmStartAdless() {
    saveTimestamp('dm_player_start')
    return new Promise(async (resolve) => {
      const player = await dailymotion.createPlayer('dm-player', { video: 'x9hnw4q' })
      player.on(
        dailymotion.events.VIDEO_PLAYING,
        () => {
          saveTimestamp('dm_metric_end')
          setTimeout(player.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  async function jwLoadScript() {
    saveTimestamp('jw_script_start')
    return new Promise((resolve) => {
      const onload = () => {
        saveTimestamp('jw_script_end')
        resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://content.jwplatform.com/libraries/IDzF9Zmk.js'
      document.querySelector('#jw-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onload
      document.head.appendChild(script)
    })
  }

  async function jwStartPreroll() {
    saveTimestamp('jw_player_start')
    return new Promise(async (resolve) => {
      const player = await jwplayer('jw-player').setup({
        autostart: true,
        file: 'https://content.jwplatform.com/manifests/yp34SRmf.m3u8',
        advertising: {
          client: 'googima',
          schedule: [
            {
              offset: 'pre',
              tag: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
              custParams: {},
            },
          ],
        },
      })
      player.once('adImpression', () => {
        saveTimestamp('jw_metric_end')
        setTimeout(player.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  async function jwStartAdless() {
    saveTimestamp('jw_player_start')
    return new Promise(async (resolve) => {
      const jwPlayer = await jwplayer('jw-player').setup({
        autostart: true,
        file: 'https://content.jwplatform.com/manifests/yp34SRmf.m3u8',
      })
      jwPlayer.once('firstFrame', () => {
        saveTimestamp('jw_metric_end')
        setTimeout(jwPlayer.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  async function run() {
    await dmLoadScript()
    preset === 'adless' ? await dmStartAdless() : await dmStartPreroll()
    await jwLoadScript()
    preset === 'adless' ? await jwStartAdless() : await jwStartPreroll()
    saveData()
    displayChart()
    displayResults()
  }

  function displayResults() {
    const metrics = [
      {
        node: '#dm-script-duration',
        duration: timestamps.dm_script_end - timestamps.dm_script_start,
        cssvar: '--dm-script-width',
      },
      {
        node: '#dm-metric-duration',
        duration: timestamps.dm_metric_end - timestamps.dm_player_start,
        cssvar: '--dm-metric-width',
      },
      {
        node: '#dm-total-duration',
        duration: timestamps.dm_metric_end - timestamps.dm_script_start,
        cssvar: '--dm-total-width',
      },
      {
        node: '#jw-script-duration',
        duration: timestamps.jw_script_end - timestamps.jw_script_start,
        cssvar: '--jw-script-width',
      },
      {
        node: '#jw-metric-duration',
        duration: timestamps.jw_metric_end - timestamps.jw_player_start,
        cssvar: '--jw-metric-width',
      },
      {
        node: '#jw-total-duration',
        duration: timestamps.jw_metric_end - timestamps.jw_script_start,
        cssvar: '--jw-total-width',
      },
    ]
    const max = Math.max(...metrics.map(({ duration }) => duration))

    metrics.forEach(({ node, duration, cssvar }) => {
      const width = `${Math.round((duration / max) * 100)}%`
      document.querySelector(node).innerHTML = `${duration}ms`
      document.documentElement.style.setProperty(cssvar, width)
    })

    document.querySelector('#step').innerHTML = `Benchmark done ✔`
    document.querySelector('.loader').remove()
  }

  function saveData() {
    const data = {
      script: timestamps.dm_script_end - timestamps.dm_script_start,
      metric: timestamps.dm_metric_end - timestamps.dm_player_start,
    }

    const item = localStorage.getItem(preset)
    const array = item ? JSON.parse(item) : []
    array.push(data)
    localStorage.setItem(preset, JSON.stringify(array))
  }

  function displayChart() {
    const item = localStorage.getItem(preset)

    if (item) {
      const data = JSON.parse(item)
      const ctx = document.querySelector('#chart canvas')
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...data.keys()],
          datasets: [
            {
              label: 'Script latency',
              data: data.map((o) => o.script),
              borderColor: '#ff9800',
              backgroundColor: '#ff9800',
              fill: false,
              tension: 0.1,
            },
            {
              label: preset === 'adless' ? 'Time to TTFF' : 'Time to impression',
              data: data.map((o) => o.metric),
              borderColor: '#2196f3',
              backgroundColor: '#2196f3',
              fill: false,
              tension: 0.1,
            },
          ],
        },
      })
    }
  }
})()
