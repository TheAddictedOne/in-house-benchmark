;(async () => {
  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Declarations                                                                                  │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const PLAY_DURATION = 5100 // in ms. Arbitrary number to make the page feeling alive by playing videos for some seconds
  const marks = {} // Keep in memory marks

  /**
   * Load DM script
   */
  const load_dm_script = async (id) => {
    log_mark(performance.mark('dm_script_start'))
    return new Promise((resolve) => {
      const onLoad = () => {
        log_mark(performance.mark('dm_script_end'))
        resolve()
      }
      const script = document.createElement('script')
      script.src = `https://geo.dailymotion.com/libs/player/${id}.js`
      document.querySelector('#dm-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onLoad
      document.head.appendChild(script)
    })
  }

  /**
   * Create DM player
   */
  const start_dm_player = async () => {
    log_mark(performance.mark('dm_player_start'))
    return new Promise(async (resolve) => {
      const player = await dailymotion.createPlayer('dm-player', { video: 'x9hhim0' })
      player.on(
        dailymotion.events.VIDEO_PLAYING,
        () => {
          log_mark(performance.mark('dm_player_end'))
          setTimeout(player.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  /**
   * Load JW script
   */
  const load_jw_script = async () => {
    log_mark(performance.mark('jw_script_start'))
    return new Promise((resolve) => {
      const onLoad = () => {
        log_mark(performance.mark('jw_script_end'))
        resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://content.jwplatform.com/libraries/IDzF9Zmk.js'
      document.querySelector('#jw-script-src').innerHTML = `<code>${script.src}</code>`
      script.onload = onLoad
      document.head.appendChild(script)
    })
  }

  /**
   * Create JW player
   */
  const start_jw_player = async () => {
    log_mark(performance.mark('jw_player_start'))
    return new Promise(async (resolve) => {
      const jwPlayer = await jwplayer('jw-player').setup({
        autostart: true,
        playlist: 'https://cdn.jwplayer.com/v2/media/hWF9vG66', // Big Buck Bunny
        // playlist: "https://cdn.jwplayer.com/v2/media/pjntNKMa", // Video from NewsCorp benchmark
      })
      jwPlayer.once('firstFrame', () => {
        log_mark(performance.mark('jw_player_end'))
        setTimeout(jwPlayer.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  /**
   * Display mark in page
   * @param {PerformanceMark} mark
   */
  const log_mark = (mark) => {
    marks[mark.name] = mark // Save mark in upper scope for later usage
    document.querySelector('#logs').innerHTML += `<div class="log-row">
        <span><code>${mark.name}</code></span>
        <span class="font-mono">${Math.round(mark.startTime)}ms</span>
      </div>`
  }

  /**
   * Display duration between start and end in page
   * @param {string} id
   * @param {PerformanceMark} start
   * @param {PerformanceMark} end
   */
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

  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Runtime                                                                                       │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const params = new URLSearchParams(document.location.search)
  const id = params.get('id') || 'x136j6'
  log_mark(performance.mark('origin', { startTime: 0 }))
  await load_dm_script(id)
  await start_dm_player()
  await load_jw_script()
  await start_jw_player()
  log_diff('#dm-diff', marks.dm_script_start, marks.dm_script_end)
  log_diff('#dm-diff', marks.dm_player_start, marks.dm_player_end)
  log_total('#dm-diff', marks.dm_script_start, marks.dm_player_end)
  log_diff('#jw-diff', marks.jw_script_start, marks.jw_script_end)
  log_diff('#jw-diff', marks.jw_player_start, marks.jw_player_end)
  log_total('#jw-diff', marks.jw_script_start, marks.jw_player_end)
})()
