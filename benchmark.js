;(async () => {
  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Declarations                                                                                  │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const PLAY_DURATION = 5100 // in ms. Arbitrary number to make the page feeling alive by playing videos for some seconds
  const marks = {} // Keep in memory marks

  const autoreload_on_preset = (preset) => {
    const node = document.querySelector('#preset')
    node.value = preset
    node.addEventListener('change', () => {
      const url = new URL(location.href)
      url.searchParams.set('preset', node.value)
      document.location.href = url
    })
  }

  const save_mark = (name) => {
    document.querySelector('#step').innerHTML = `Saving <code>${name}</code> mark ...`
    const mark = performance.mark(name)
    marks[name] = mark // Save mark in upper scope for later usage
    document.querySelector('#logs').innerHTML += `<div class="log-row">
        <span><code>${name}</code></span>
        <span class="font-mono">${Math.round(mark.startTime)}ms</span>
      </div>`
  }

  const load_dm_script = async (id) => {
    save_mark('dm_script_start')
    return new Promise((resolve) => {
      const onload = () => {
        save_mark('dm_script_end')
        resolve()
      }
      const script = document.createElement('script')
      script.src = `https://geo.dailymotion.com/libs/player/${id}.js`
      document.querySelector('#dm-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onload
      document.head.appendChild(script)
    })
  }

  const start_dm_preroll = async () => {
    save_mark('dm_player_start')
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
          save_mark('dm_metric_end')
          setTimeout(player.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  const start_dm_adless = async () => {
    save_mark('dm_player_start')
    return new Promise(async (resolve) => {
      const player = await dailymotion.createPlayer('dm-player', { video: 'x9hnw4q' })
      player.on(
        dailymotion.events.VIDEO_PLAYING,
        () => {
          save_mark('dm_metric_end')
          setTimeout(player.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  const load_jw_script = async () => {
    save_mark('jw_script_start')
    return new Promise((resolve) => {
      const onload = () => {
        save_mark('jw_script_end')
        resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://content.jwplatform.com/libraries/IDzF9Zmk.js'
      document.querySelector('#jw-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onload
      document.head.appendChild(script)
    })
  }

  const start_jw_preroll = async () => {
    save_mark('jw_player_start')
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
        save_mark('jw_metric_end')
        setTimeout(player.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  const start_jw_adless = async () => {
    save_mark('jw_player_start')
    return new Promise(async (resolve) => {
      const jwPlayer = await jwplayer('jw-player').setup({
        autostart: true,
        file: 'https://content.jwplatform.com/manifests/yp34SRmf.m3u8',
      })
      jwPlayer.once('firstFrame', () => {
        save_mark('jw_metric_end')
        setTimeout(jwPlayer.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  const log_diff = (id, start, end) => {
    const diff = Math.round(end.startTime - start.startTime)
    document.querySelector(id).innerHTML += `${diff}ms`
  }

  const run_adless_routine = async ({ preset, id }) => {
    await load_dm_script(id || 'x136j6')
    await start_dm_adless()
    await load_jw_script()
    await start_jw_adless()
    save_in_local_storage(preset)
    log_averages(preset)
    display_results()
  }

  const display_results = () => {
    const dmScriptDuration = Math.round(
      marks.dm_script_end.startTime - marks.dm_script_start.startTime
    )
    const dmMetricDuration = Math.round(
      marks.dm_metric_end.startTime - marks.dm_player_start.startTime
    )
    const dmTotalDuration = Math.round(
      marks.dm_metric_end.startTime - marks.dm_script_start.startTime
    )
    const jwScriptDuration = Math.round(
      marks.jw_script_end.startTime - marks.jw_script_start.startTime
    )
    const jwMetricDuration = Math.round(
      marks.jw_metric_end.startTime - marks.jw_player_start.startTime
    )
    const jwTotalDuration = Math.round(
      marks.jw_metric_end.startTime - marks.jw_script_start.startTime
    )
    const max = Math.max(dmTotalDuration, jwTotalDuration)
    document.querySelector('#dm-script-duration').innerHTML = `${dmScriptDuration}ms`
    document.documentElement.style.setProperty(
      '--dm-script-gauge-width',
      `${Math.round((dmScriptDuration / max) * 100)}%`
    )
    document.querySelector('#dm-metric-duration').innerHTML = `${dmMetricDuration}ms`
    document.documentElement.style.setProperty(
      '--dm-metric-gauge-width',
      `${Math.round((dmMetricDuration / max) * 100)}%`
    )
    document.querySelector('#dm-total-duration').innerHTML = `${dmTotalDuration}ms`
    document.documentElement.style.setProperty(
      '--dm-total-gauge-width',
      `${Math.round((dmTotalDuration / max) * 100)}%`
    )
    document.querySelector('#jw-script-duration').innerHTML = `${jwScriptDuration}ms`
    document.documentElement.style.setProperty(
      '--jw-script-gauge-width',
      `${Math.round((jwScriptDuration / max) * 100)}%`
    )
    document.querySelector('#jw-metric-duration').innerHTML = `${jwMetricDuration}ms`
    document.documentElement.style.setProperty(
      '--jw-metric-gauge-width',
      `${Math.round((jwMetricDuration / max) * 100)}%`
    )
    document.querySelector('#jw-total-duration').innerHTML = `${jwTotalDuration}ms`
    document.documentElement.style.setProperty(
      '--jw-total-gauge-width',
      `${Math.round((jwTotalDuration / max) * 100)}%`
    )
    document.querySelector('#step').innerHTML = `Benchmark done ✔`
    document.querySelectorAll('.loader').forEach((node) => node.remove())
  }

  const run_preroll_routine = async ({ preset, id }) => {
    await load_dm_script(id || 'x15doe')
    await start_dm_preroll()
    await load_jw_script()
    await start_jw_preroll()
    save_in_local_storage(preset)
    log_averages(preset)
    display_results()
  }

  const save_in_local_storage = (key) => {
    const newRow = {
      script: Math.round(marks.dm_script_end.startTime - marks.dm_script_start.startTime),
      metric: Math.round(marks.dm_metric_end.startTime - marks.dm_player_start.startTime),
    }

    const item = localStorage.getItem(key)

    if (item) {
      const array = JSON.parse(item)
      array.push(newRow)
      localStorage.setItem(key, JSON.stringify(array))
    } else {
      const newArray = [newRow]
      localStorage.setItem(key, JSON.stringify(newArray))
    }
  }

  const log_averages = (key) => {
    const item = localStorage.getItem(key)

    if (item) {
      const data = JSON.parse(item)
      const ctx = document.querySelector('#chart canvas')
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...data.keys()],
          datasets: [
            {
              label: 'script latency',
              data: data.map((o) => o.script),
              borderColor: '#ff9800',
              backgroundColor: '#ff9800',
              fill: false,
              tension: 0.1,
            },
            {
              label: key === 'adless' ? 'player starts to ttff' : 'player starts to ad impression',
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

  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Runtime                                                                                       │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const params = new URLSearchParams(document.location.search)
  const preset = params.get('preset') || 'adless'
  const id = params.get('id')

  autoreload_on_preset(preset)

  switch (preset) {
    case 'preroll':
      run_preroll_routine({ preset, id })
      break
    case 'adless':
    default:
      run_adless_routine({ preset, id })
  }
})()
