;(async () => {
  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Declarations                                                                                  │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  const PLAY_DURATION = 5100 // in ms. Arbitrary number to make the page feeling alive by playing videos for some seconds
  const marks = {} // Keep in memory marks

  /**
   * Create DM player
   * Set dm_* performance marks
   */
  const start_dm_player = async () => {
    log_mark(performance.mark('dm_start'))
    return new Promise(async (resolve) => {
      const dmPlayer = await dailymotion.createPlayer('dm-player', { video: 'x9hhim0' })
      dmPlayer.on(
        dailymotion.events.VIDEO_PLAYING,
        () => {
          log_mark(performance.mark('dm_end'))
          setTimeout(dmPlayer.pause, PLAY_DURATION)
          resolve()
        },
        { once: true }
      )
    })
  }

  /**
   * Create JW player
   * Set jw_* performance marks
   */
  const start_jw_player = async () => {
    log_mark(performance.mark('jw_start'))
    return new Promise(async (resolve) => {
      const jwPlayer = await jwplayer('jw-player').setup({
        autostart: true,
        playlist: 'https://cdn.jwplayer.com/v2/media/hWF9vG66', // Big Buck Bunny
        // playlist: "https://cdn.jwplayer.com/v2/media/pjntNKMa", // Video from NewsCorp benchmark
      })
      jwPlayer.once('firstFrame', () => {
        log_mark(performance.mark('jw_end'))
        setTimeout(jwPlayer.pause, PLAY_DURATION)
        resolve()
      })
    })
  }

  /**
   * Display mark in page
   * @param {PerformanceMark} mark
   */
  function log_mark(mark) {
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
  function log_diff(id, start, end) {
    const diff = Math.round(end.startTime - start.startTime)
    document.querySelector(id).innerHTML +=
      `<code>${start.name}</code> to <code>${end.name}</code> → ${diff}ms`
  }

  // ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
  // │                                                                                               │
  // │ Runtime                                                                                       │
  // │                                                                                               │
  // └───────────────────────────────────────────────────────────────────────────────────────────────┘
  log_mark(window.performance.mark('origin', { startTime: 0 }))
  await start_dm_player()
  await start_jw_player()
  log_diff('#dm-diff', marks.dm_start, marks.dm_end)
  log_diff('#jw-diff', marks.jw_start, marks.jw_end)
})()
