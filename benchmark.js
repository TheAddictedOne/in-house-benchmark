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
          save_mark('dm_ad_impression')
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
          save_mark('dm_ttff')
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
        save_mark('jw_ad_impression')
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
        save_mark('jw_ttff')
        setTimeout(jwPlayer.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  const log_diff = (id, start, end) => {
    const diff = Math.round(end.startTime - start.startTime)
    document.querySelector(id).innerHTML += `<div class="log-row">
      <span><code>${start.name}</code> to <code>${end.name}</code></span>
      <span class="font-mono">${diff}ms</span>
    </div>`
  }

  const log_total = (id, start, end) => {
    const diff = Math.round(end.startTime - start.startTime)
    document.querySelector(id).innerHTML += `<div class="log-row">
      <span>Total</span>
      <span class="font-mono">${diff}ms</span>
    </div>`
  }

  const run_adless_routine = async (id) => {
    await load_dm_script(id || 'x136j6')
    await start_dm_adless()
    await load_jw_script()
    await start_jw_adless()
    log_diff('#dm-diff', marks.dm_script_start, marks.dm_script_end)
    log_diff('#dm-diff', marks.dm_player_start, marks.dm_ttff)
    log_total('#dm-diff', marks.dm_script_start, marks.dm_ttff)
    log_diff('#jw-diff', marks.jw_script_start, marks.jw_script_end)
    log_diff('#jw-diff', marks.jw_player_start, marks.jw_ttff)
    log_total('#jw-diff', marks.jw_script_start, marks.jw_ttff)
  }

  const run_preroll_routine = async (id) => {
    await load_dm_script(id || 'x15doe')
    await start_dm_preroll()
    await load_jw_script()
    await start_jw_preroll()
    log_diff('#dm-diff', marks.dm_script_start, marks.dm_script_end)
    log_diff('#dm-diff', marks.dm_player_start, marks.dm_ad_impression)
    log_total('#dm-diff', marks.dm_script_start, marks.dm_ad_impression)
    log_diff('#jw-diff', marks.jw_script_start, marks.jw_script_end)
    log_diff('#jw-diff', marks.jw_player_start, marks.jw_ad_impression)
    log_total('#jw-diff', marks.jw_script_start, marks.jw_ad_impression)
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
      run_preroll_routine(id)
      break
    case 'adless':
    default:
      run_adless_routine(id)
  }
})()
