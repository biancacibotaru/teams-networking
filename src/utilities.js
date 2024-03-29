export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

export function debounce(fn, ms) {
  let timer;

  return function (e) {
    const context = this;
    const args = arguments;

    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, ms);
  };
}

/**
 *
 * @param {String|Element} el
 */
export function mask(el) {
  if (typeof el === "string") {
    el = $(el);
  }
  el && el.classList.add("loading-mask");
  //$("#teamsForm").classList.add("loading-mask");
}

export function unmask(el) {
  if (typeof el === "string") {
    el = $(el);
  }
  el && el.classList.remove("loading-mask");
}

export function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export function filterElements(elements, search) {
  search = search.toLowerCase();
  return elements.filter(element => {
    return Object.entries(element).some(([key, value]) => {
      if (key !== "id") {
        return value.toLowerCase().includes(search);
      }
    });
  });
}

(async () => {
  console.info("start sleeping...");
  await sleep(2000);
  console.warn("2. we are ready to do %o", "next job");
})();
