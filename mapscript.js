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
    attribution: 'HIO 1.5.16'
}).addTo(map);
map.fitBounds([
    crs.unproject(L.point(mapExtent[2], mapExtent[3])),
    crs.unproject(L.point(mapExtent[0], mapExtent[1]))
]);

// map.zoomControl.remove();
L.control.zoom({
    position: 'topright'
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
let containers, lootList, items;

Promise.all([getJSON("containers.json"), getJSON("loot.json"), getJSON("items.json")]).then((values) => {
    [containers, lootList, items] = values;

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

    fillLootList(lootList, false, false);
    fillItemList(items);
});

function fillItemList(itemsToFill) {
    let itemList = '';
    for (let itemId in itemsToFill) {
        itemList += '  <div class="box r' + itemsToFill[itemId].r + ' itemIconChoose" onclick="chooseSearchItem(this)" title="' + itemsToFill[itemId].name + '" itemid="' + itemId + '"><img src="icons/' + itemsToFill[itemId].ic + '"/></div>';
    }
    document.getElementsByClassName('itemList')[0].innerHTML = itemList;
}

function onOverLabel(label) {
    let lootIdRects = rects[label.getElementsByTagName("input")[0].id];
    for (let rectObj of lootIdRects) {
        resizeRect(rectObj, 8, '#0a62ad');

        if (!map.hasLayer(rectObj.mapRect)) {
            rectObj.mapRect.addTo(map);
        }
    }
}

function onOutLabel(label) {
    let checkbox = label.getElementsByTagName("input")[0];
    let lootIdRects = rects[checkbox.id];
    for (let rectObj of lootIdRects) {
        resizeRect(rectObj, 1, '#ff7800');

        if (!checkbox.checked && map.hasLayer(rectObj.mapRect)) {
            rectObj.mapRect.remove(map);
        }
    }
}

function resizeRect(rectObj, multiple, color) {
    let c1 = [rectObj.center[0] + rectObj.size[0] * multiple, rectObj.center[1] + rectObj.size[1] * multiple];
    let c2 = [rectObj.center[0] - rectObj.size[0] * multiple, rectObj.center[1] - rectObj.size[1] * multiple];
    rectObj.mapRect.setBounds([c1, c2]);
    try { rectObj.mapRect.transform.rotate(-rectObj.rot, [rectObj.center[0], rectObj.center[1]]); } catch (e) { }
    rectObj.mapRect.setStyle({ color: color });
}

function toggleContainer(id, checked) {
    let lootIdRects = rects[id];
    for (let rectObj of lootIdRects) {
        checked ? rectObj.mapRect.addTo(map) : rectObj.mapRect.remove(map);
    }
}

function checkAll(isAllCheck) {
    document.querySelectorAll('input[type=checkbox]').forEach(el => {
        el.checked = isAllCheck
        if (isAllCheck) {
            for (let rectObj of rects[el.id]) {
                rectObj.mapRect.addTo(map);
            }
        }
    });

    if (!isAllCheck) {
        for (let lootId in rects) {
            let lootIdRects = rects[lootId];
            for (let rectObj of lootIdRects) {
                rectObj.mapRect.remove(map);
            }
        }
    }
}

const modal = document.querySelector(".modal");

function toggleModal() {
    modal.classList.toggle("show-modal");
}

function showModal() {
    toggleModal();
    document.getElementById("inputSearch").focus();
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleModal();
    }
}
addEventListener("mousedown", windowOnClick);

function chooseSearchItem(elem) {
    let itemId = elem.getAttribute("itemid");
    toggleModal();

    let imageSlotSearch = document.getElementById("searchImage");
    imageSlotSearch.style.display = "block";
    imageSlotSearch.src = "icons/" + items[itemId].ic;
    imageSlotSearch.className = "r" + items[itemId].r;

    document.getElementById("clearSearch").style.display = "flex";

    let containersWithItem = {};
    for (let lootId in lootList) {
        let loot = lootList[lootId].loot;
        for (let item of loot) {
            if (item[0] == itemId) {
                containersWithItem[lootId] = item[2];
                break;
            }
        }
    }

    const chanceSorted = Object.fromEntries(Object.entries(containersWithItem).sort(([, a], [, b]) => b - a));

    checkAll(false);
    fillLootList(chanceSorted, true, true);
}

function fillLootList(list, withChances, toggle) {
    let htmlLootList = "";
    for (let lootId in list) {
        let loot = lootList[lootId];
        let containersAmount = rects[lootId].length;
        let chanceString = "";

        if (toggle) toggleContainer(lootId, true);
        if (withChances) chanceString = '<span class="container-chance">' + list[lootId] + '%</span>';

        htmlLootList += '<label onmouseover="onOverLabel(this)" onmouseout="onOutLabel(this)"><input type="checkbox" id="' + lootId + '" checked="checked" onchange="toggleContainer(this.id, this.checked)">' + loot.name + ' [' + containersAmount + ']' + chanceString + '</label><br>';
    }
    document.getElementsByClassName('lootlist')[0].innerHTML = htmlLootList;
}

function clearSearch() {
    fillLootList(lootList, false, true);
    let imageSlotSearch = document.getElementById("searchImage");
    imageSlotSearch.style.display = "none";

    document.getElementById("clearSearch").style.display = "none";
}

function searchHandler(e) {
    let filtered = Object.fromEntries(Object.entries(items).filter(([key, value]) => { return value.name.toLowerCase().includes(e.value) }));
    fillItemList(filtered);
}