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
// L.control.mousePosition().addTo(map) //coordinates

map.zoomControl.remove();
L.control.zoom({
    position: 'bottomleft'
}).addTo(map);

const getJSON = async url => {
    const response = await fetch(url);
    return response.json();
}

let rectArray = [];
let toggled = true;
let itemsJson = getJSON("items.json");

getJSON("containers.json")
    .then(async (data) => {
        let items = await itemsJson;
        for (let container of data) {
            let tooltip = '<div class="game-board">';
            for (let itemChance of container.l) {
                tooltip += '  <div class="box r' + items[itemChance[0]].r + '"><img src="icons/' + items[itemChance[0]].ic + '"/>  <div class="bottom-right">' + itemChance[2] + '%</div><div class="top-left">' + itemChance[1] + '</div></div>';
            }
            tooltip += '</div>';

            let rect = L.rectangle([container.c1, container.c2], {
                color: "#ff7800",
                weight: 1,
                transform: true
            }).bindPopup(tooltip).addTo(map);
            rectArray.push(rect);

            try { rect.transform.rotate(-container.r, [container.c1[0] + (container.c2[0] - container.c1[0]) / 2, container.c1[1] + (container.c2[1] - container.c1[1]) / 2]); } catch (e) { }
        }
    })

function toggleContainers() {
    let btn = document.getElementById('Btn2');
    if (toggled) {
        for (let rect of rectArray) {
            rect.remove(map);
        }
        btn.value = "Show containers";
    } else {
        for (let rect of rectArray) {
            rect.addTo(map);
        }
        btn.value = "Hide containers";
    }
    toggled = !toggled;
}