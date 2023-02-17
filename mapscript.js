var mapExtent = [0.00000000, -17280.00000000, 14840.00000000, 0.00000000];
var mapMinZoom = 2;
var mapMaxZoom = 6;
var mapMaxResolution = 1.00000000;
var mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;
var tileExtent = [0.00000000, -17280.00000000, 14840.00000000, 0.00000000];
var crs = L.CRS.Simple;
crs.transformation = new L.Transformation(1, -tileExtent[0], -1, tileExtent[3]);
crs.scale = function (zoom) {
    return Math.pow(2, zoom) / mapMinResolution;
};
crs.zoom = function (scale) {
    return Math.log(scale * mapMinResolution) / Math.LN2;
};
var layer;
var map = new L.Map('map', {
    maxZoom: mapMaxZoom,
    minZoom: mapMinZoom,
    crs: crs
});

layer = L.tileLayer('{z}/{x}/{y}.png', {
    minZoom: mapMinZoom,
    maxZoom: mapMaxZoom,
    tileSize: L.point(512, 512),
    noWrap: true,
    tms: false,
}).addTo(map);
map.fitBounds([
    crs.unproject(L.point(mapExtent[2], mapExtent[3])),
    crs.unproject(L.point(mapExtent[0], mapExtent[1]))
]);

map.zoomControl.remove();
L.control.zoom({
    position: 'bottomleft'
}).addTo(map);
var sidebar = L.control.sidebar('sidebar').addTo(map);
if (document.body.clientWidth >= 768) {
    sidebar.open("home");
}


const getJSON = async url => {
    const response = await fetch(url);
    return response.json();
}

let rects = {};
let toggled = true;

Promise.all([getJSON("containers.json"), getJSON("loot.json"), getJSON("items.json")]).then((values) => {
    let [containers, lootList, items] = values;

    for (let container of containers) {
        let tooltip = '<div class="loot-tooltip">';
        for (let itemChance of lootList[container.l].loot) {
            tooltip += '  <div class="box r' + items[itemChance[0]].r + '"><img src="icons/' + items[itemChance[0]].ic + '"/>  <div class="bottom-right">' + itemChance[2] + '%</div><div class="top-left">' + itemChance[1] + '</div></div>';
        }
        tooltip += '</div>';

        let c1 = [container.center[0] + container.size[0], container.center[1] + container.size[1]]
        let c2 = [container.center[0] - container.size[0], container.center[1] - container.size[1]]
        let rect = L.rectangle([c1, c2], {
            color: "#ff7800",
            weight: 1,
            transform: true
        }).bindPopup(tooltip).addTo(map);

        let rectObj = {
            rot: container.r,
            mapRect: rect,
            center: container.center,
            size: container.size
        }
        rects[container.l] == undefined ? rects[container.l] = [rectObj] : rects[container.l].push(rectObj);

        try { rect.transform.rotate(-container.r, [container.center[0], container.center[1]]); } catch (e) { }
    }

    let htmlList = "";
    for (let lootId in lootList) {
        let loot = lootList[lootId];
        let containersAmount = rects[lootId].length;
        htmlList += '<label><input type="checkbox" id="' + lootId + '" checked="checked" onchange="toggleContainer(this)">' + loot.name + ' (' + containersAmount + ')</label><br>';
    }
    document.getElementsByClassName('lootlist')[0].innerHTML = htmlList;

    a = document.getElementsByTagName('label')
    for (i in a) {
        a[i].onmouseover = function () {
            let lootIdRects = rects[this.getElementsByTagName("input")[0].id];
            for (let rectObj of lootIdRects) {
                resizeRect(rectObj, 5, '#0a62ad');
            }
        }
        a[i].onmouseout = function () {
            let lootIdRects = rects[this.getElementsByTagName("input")[0].id];
            for (let rectObj of lootIdRects) {
                resizeRect(rectObj, 1, '#ff7800');
            }
        }
    }
});

function resizeRect(rectObj, multiple, color) {
    let c1 = [rectObj.center[0] + rectObj.size[0] * multiple, rectObj.center[1] + rectObj.size[1] * multiple];
    let c2 = [rectObj.center[0] - rectObj.size[0] * multiple, rectObj.center[1] - rectObj.size[1] * multiple];
    rectObj.mapRect.setBounds([c1, c2]);
    try { rectObj.mapRect.transform.rotate(-rectObj.rot, [rectObj.center[0], rectObj.center[1]]); } catch (e) { }
    rectObj.mapRect.setStyle({ color: color });
}

function toggleContainer(checkboxElem) {
    let lootIdRects = rects[checkboxElem.id];
    for (let rectObj of lootIdRects) {
        checkboxElem.checked ? rectObj.mapRect.addTo(map) : rectObj.mapRect.remove(map);
    }
}

function checkAll(isAllCheck) {
    document.querySelectorAll('input[type=checkbox]').forEach(el => el.checked = isAllCheck);

    for (let lootId in rects) {
        let lootIdRects = rects[lootId];
        for (let rectObj of lootIdRects) {
            isAllCheck ? rectObj.mapRect.addTo(map) : rectObj.mapRect.remove(map);
        }
    }
}