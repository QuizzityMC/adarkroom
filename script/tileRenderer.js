/**
 * Tile rendering system for visual overhaul
 * Converts text/ASCII representation to visual tile-based graphics
 */

var TileRenderer = {
  TILE_SIZE: 16,
  
  /**
   * Create a tile element with given class
   */
  createTile: function(tileClass, tooltip) {
    var tile = $('<div>')
      .addClass('tile')
      .addClass(tileClass);
    
    if (tooltip) {
      tile.attr('data-tooltip', tooltip);
    }
    
    return tile;
  },
  
  /**
   * Convert terrain character to tile class
   */
  getTerrainTileClass: function(char) {
    switch(char) {
      case ';': return 'tile-forest';
      case ',': return 'tile-field';
      case '.': return 'tile-barrens';
      case '#': return 'tile-road';
      case '~': return 'tile-water';
      default: return 'tile-barrens';
    }
  },
  
  /**
   * Convert landmark character to tile class and tooltip
   */
  getLandmarkTile: function(char) {
    var tileClass, tooltip;
    
    switch(char) {
      case 'A':
        tileClass = 'tile-village';
        tooltip = 'The Village';
        break;
      case 'H':
        tileClass = 'tile-house';
        tooltip = 'An Old House';
        break;
      case 'I':
        tileClass = 'tile-mine';
        tooltip = 'Iron Mine';
        break;
      case 'C':
        tileClass = 'tile-mine';
        tooltip = 'Coal Mine';
        break;
      case 'S':
        tileClass = 'tile-mine';
        tooltip = 'Sulphur Mine';
        break;
      case 'O':
        tileClass = 'tile-house';
        tooltip = 'An Abandoned Town';
        break;
      case 'Y':
        tileClass = 'tile-house';
        tooltip = 'A Ruined City';
        break;
      case '@':
        tileClass = 'tile-player';
        tooltip = 'Wanderer';
        break;
      default:
        tileClass = 'tile-barrens';
        tooltip = null;
    }
    
    return { tileClass: tileClass, tooltip: tooltip };
  },
  
  /**
   * Render the world map as tiles
   */
  renderWorldMap: function(map, mask, curPos, radius) {
    var container = $('<div>')
      .attr('id', 'map-tiles')
      .css({
        'grid-template-columns': 'repeat(' + (radius * 2 + 1) + ', ' + TileRenderer.TILE_SIZE + 'px)',
        'grid-template-rows': 'repeat(' + (radius * 2 + 1) + ', ' + TileRenderer.TILE_SIZE + 'px)'
      });
    
    for (var j = 0; j <= radius * 2; j++) {
      for (var i = 0; i <= radius * 2; i++) {
        var tile;
        
        // Check if this is the player position
        if (curPos[0] === i && curPos[1] === j) {
          tile = TileRenderer.createTile('tile-player', 'Wanderer');
        }
        // Check if this tile is visible
        else if (mask[i][j]) {
          var mapChar = map[i][j];
          var isLandmark = typeof World.LANDMARKS[mapChar] !== 'undefined' || 
                          mapChar === 'A' || mapChar === '@';
          
          if (isLandmark) {
            var landmarkInfo = TileRenderer.getLandmarkTile(mapChar);
            tile = TileRenderer.createTile(landmarkInfo.tileClass, landmarkInfo.tooltip);
          } else {
            // Get first character if marked as visited
            if (mapChar.length > 1) {
              mapChar = mapChar[0];
            }
            var terrainClass = TileRenderer.getTerrainTileClass(mapChar);
            tile = TileRenderer.createTile(terrainClass);
          }
        } else {
          // Fog of war
          tile = TileRenderer.createTile('tile-barrens tile-fog');
        }
        
        // Make tiles clickable for movement
        tile.attr('data-x', i);
        tile.attr('data-y', j);
        
        container.append(tile);
      }
    }
    
    return container;
  },
  
  /**
   * Create a hut tile element
   */
  createHutTile: function(x, y) {
    return TileRenderer.createTile('tile-hut', 'Hut')
      .css({
        'grid-column': x,
        'grid-row': y
      });
  },
  
  /**
   * Create a villager tile element
   */
  createVillagerTile: function(x, y, job) {
    return TileRenderer.createTile('tile-villager', job || 'Villager')
      .css({
        'grid-column': x,
        'grid-row': y
      });
  },
  
  /**
   * Render village view with buildings and villagers
   */
  renderVillage: function(buildings, population) {
    var container = $('<div>').attr('id', 'village-tiles');
    
    // Add central fire
    var fire = TileRenderer.createTile('tile-fire', 'Fire')
      .css({
        'grid-column': '10',
        'grid-row': '7',
        'z-index': '5'
      });
    container.append(fire);
    
    // Add village marker
    var village = TileRenderer.createTile('tile-village', 'Village Center')
      .css({
        'grid-column': '10',
        'grid-row': '8'
      });
    container.append(village);
    
    // Place huts in a circle around the center
    var hutCount = buildings.hut || 0;
    var angleStep = (Math.PI * 2) / Math.max(hutCount, 1);
    var radius = 5;
    
    for (var i = 0; i < hutCount; i++) {
      var angle = i * angleStep;
      var x = Math.round(10 + radius * Math.cos(angle));
      var y = Math.round(8 + radius * Math.sin(angle));
      
      // Clamp to grid bounds
      x = Math.max(2, Math.min(19, x));
      y = Math.max(2, Math.min(14, y));
      
      var hut = TileRenderer.createHutTile(x, y);
      container.append(hut);
    }
    
    // Add villagers scattered around
    if (population && population > 0) {
      var villagersToShow = Math.min(population, 20); // Limit for performance
      
      for (var v = 0; v < villagersToShow; v++) {
        // Random position not on buildings
        var vx = Math.floor(Math.random() * 18) + 2;
        var vy = Math.floor(Math.random() * 13) + 2;
        
        // Avoid center where fire/village is
        if (Math.abs(vx - 10) < 2 && Math.abs(vy - 8) < 2) {
          continue;
        }
        
        var villager = TileRenderer.createVillagerTile(vx, vy, 'Villager ' + (v + 1));
        
        // Add random walking animation delay
        villager.css('animation-delay', (Math.random() * 3) + 's');
        
        container.append(villager);
      }
    }
    
    // Add lodge if exists
    if (buildings.lodge > 0) {
      var lodge = TileRenderer.createTile('tile-house', 'Lodge')
        .css({
          'grid-column': '16',
          'grid-row': '4',
          'width': 'calc(var(--tile-size) * 2)',
          'height': 'calc(var(--tile-size) * 2)'
        });
      container.append(lodge);
    }
    
    // Add trading post if exists
    if (buildings['trading post'] > 0) {
      var tradingPost = TileRenderer.createTile('tile-house', 'Trading Post')
        .css({
          'grid-column': '4',
          'grid-row': '4',
          'width': 'calc(var(--tile-size) * 2)',
          'height': 'calc(var(--tile-size) * 2)'
        });
      container.append(tradingPost);
    }
    
    return container;
  },
  
  /**
   * Create fire visual for room
   */
  createFireVisual: function(temp) {
    var container = $('<div>').attr('id', 'room-fire-container')
      .css({
        'text-align': 'center',
        'padding': '40px'
      });
    
    var fireSize = Math.max(1, Math.min(5, Math.floor(temp / 4)));
    
    for (var i = 0; i < fireSize; i++) {
      var flame = TileRenderer.createTile('tile-fire')
        .css({
          'display': 'inline-block',
          'margin': '2px',
          'animation-delay': (i * 0.1) + 's'
        });
      container.append(flame);
    }
    
    if (temp === 0) {
      container.html('<div class="tile tile-barrens" style="display:inline-block; width: 48px; height: 48px;">❄️</div>');
    }
    
    return container;
  }
};
