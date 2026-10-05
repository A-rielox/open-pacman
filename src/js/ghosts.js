// ghosts.js
// Decision de direccion de los fantasmas. Depende de globals de game.js:
// DIRS, OPPOSITE, canMove; y de maze.js: PEN_EXIT.

const PEN_ROW = 12; // a partir de esta fila el fantasma sigue dentro de la pen

// Avanza el contador de liberacion. Devuelve true cuando el fantasma ya sale.
function updateGhostRelease( g ) {
  if ( g.released ) return true;
  g.releaseTimer++;
  if ( g.releaseTimer >= g.releaseDelay ) g.released = true;
  return g.released;
}

// Direcciones abiertas para el fantasma: sin invertir, sin muros/puerta.
// Si no queda ninguna, se permite invertir para desbloquear.
function openDirs( game, g ) {
  const forward = Object.keys( window.DIRS ).filter(
    ( dir ) => dir !== window.OPPOSITE[ g.dir ] && window.canMove( game.grid, g.x, g.y, dir, 'ghost' )
  );
  return forward.length ? forward : [ window.OPPOSITE[ g.dir ] ];
}

// Celda objetivo segun estado/comportamiento.
//   {x,y} -> perseguir · undefined -> aleatorio · null -> detenerse
function targetFor( game, g ) {
  if ( g.y >= PEN_ROW ) return window.PEN_EXIT; // salir de la pen
  if ( g.kind === 'chaser' ) {
    return { x: Math.round( game.pacman.x ), y: Math.round( game.pacman.y ) };
  }
  return undefined;
}

// Elige la direccion que mas acerca a target; empates al azar.
function stepToward( g, choices, target ) {
  let best = [];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = window.DIRS[ dir ];
    const dist = Math.abs( g.x + d.x - target.x ) + Math.abs( g.y + d.y - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = [ dir ];
    } else if ( dist === bestDist ) {
      best.push( dir );
    }
  }
  return best[ Math.floor( Math.random() * best.length ) ];
}

function randomChoice( choices ) {
  return choices[ Math.floor( Math.random() * choices.length ) ];
}

// Devuelve la nueva direccion del fantasma, o null si debe quedarse quieto.
function decideGhost( game, g ) {
  const choices = openDirs( game, g );
  const target = targetFor( game, g );
  if ( target === undefined ) return randomChoice( choices );
  if ( target === null ) return null;
  return stepToward( g, choices, target );
}

window.updateGhostRelease = updateGhostRelease;
window.decideGhost = decideGhost;
