// Salon — the Ombrine home hero.
// A wall of looks hung in four rows of depth. Drag to wander, scroll to move
// the rows through focus (down: walk in to the row behind, up: the row by the
// screen steps back into focus), click a look to step closer and shop its
// pieces without leaving the page.
// Edit the looks, labels and motion from the properties panel.
import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, startTransition } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import { T, ff, fontLink, EASE, studioTile, bag, useBag, openBag, useLang, formatPrice, useReducedMotion, useSalonIndex, useNavigate, useLiveMap, livePrice, liveSold, liveSizes } from "./OmbrineStore.tsx"

/* ------------------------------------------------------------------ types */
interface Piece {
    name: string
    material: string
    price: number
    image: string | { src: string; alt?: string }
    aspect?: number
    sizes: string
    soldOut: string
    productLink?: string
}
interface Look {
    title: string
    slug?: string
    intro: string
    image: string | { src: string; alt?: string }
    aspect?: number
    link?: string
    pieces: Piece[]
}
interface Labels {
    threePieces: string
    viewLookPage: string
    close: string
    sizeGuide: string
    addToBag: string
    added: string
    viewBag: string
    addFullLook: string
    fullLookAdded: string
    inYourBag: string
    chooseSize: string
    soldOut: string
    notifyMe: string
    notifyThanks: string
    delivery: string
    dragHint: string
    clickHint: string
    zoomHint: string
    view: string
    look: string
}
interface Planes {
    farHeight: number
    farBlur: number
    farOpacity: number
    backHeight: number
    backBlur: number
    backOpacity: number
    midHeight: number
    frontHeight: number
    frontBlur: number
    frontDrop: number
}
interface SalonProps {
    source: "cms" | "sample"
    wordmark?: string
    season: string
    seasonLink?: string
    labels: Labels
    planes: Planes
    autoScroll: number
    direction: "rtl" | "ltr"
    motionSpeed: number
    showIntro: boolean
    showMinimap: boolean
    idleDrift: boolean
    cursorView: boolean
    style?: React.CSSProperties
}

const DEFAULT_LOOKS: Look[] = [{"title":"Camel Hour","intro":"Double-face camel, ivory wool, tan suede. Cut long and easy for the first cold mornings.","image":"https://framerusercontent.com/images/K3N2vsc2M9svXYhadXbsXiTHibk.png","aspect":0.3938,"pieces":[{"name":"Double-face wrap coat","material":"Camel wool and cashmere","price":2890,"image":"https://framerusercontent.com/images/W6FEbq5iFIoQLOx5HvNrd05YCk.png","aspect":0.5761,"sizes":"XS, S, M, L, XL","soldOut":"XL","productLink":"/products/double-face-wrap-coat-camel"},{"name":"Wide wool trousers","material":"Ivory virgin wool","price":890,"image":"https://framerusercontent.com/images/TJsia5VG0GDOQESYUhqMOTJZYfY.png","aspect":0.3708,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/wide-wool-trousers-ivory"},{"name":"Suede slingback","material":"Tan calf suede, 70 mm","price":720,"image":"https://framerusercontent.com/images/Js6aZMmkLrgYj5JXn6hx9gD3bz0.png","aspect":1.8591,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/suede-slingback-tan"}]},
{"title":"Brun","intro":"Chocolate suede over charcoal flannel. A weekend look that still goes to dinner.","image":"https://framerusercontent.com/images/uZxWHEraAfYOtmjNLCoPQtLVSY.png","aspect":0.3096,"pieces":[{"name":"Suede overshirt","material":"Chocolate goat suede","price":2150,"image":"https://framerusercontent.com/images/JCzfwCzd2vc29cr1eNWQF1JyeY.png","aspect":0.7551,"sizes":"S, M, L, XL, XXL","soldOut":"","productLink":"/products/suede-overshirt-chocolate"},{"name":"Pleated wool trousers","material":"Charcoal wool flannel","price":790,"image":"https://framerusercontent.com/images/zqq2DHfzGPgRCNGkBj9w24yA5o.png","aspect":0.3557,"sizes":"46, 48, 50, 52, 54, 56","soldOut":"","productLink":"/products/pleated-wool-trousers-charcoal"},{"name":"Penny loafer","material":"Dark brown calf leather","price":820,"image":"https://framerusercontent.com/images/i4uDOrvJkX7RPna7euwLHugskCU.png","aspect":1.6416,"sizes":"40, 41, 42, 43, 44, 45, 46","soldOut":"","productLink":"/products/penny-loafer-dark-brown"}]},
{"title":"Oxblood","intro":"Oxblood silk and black satin, both cut to move. For evenings that start early.","image":"https://framerusercontent.com/images/YnjLoU5eu2ISm7Ha5DrswOQwZHY.png","aspect":0.3609,"pieces":[{"name":"Silk bow blouse","material":"Oxblood silk crêpe de chine","price":1190,"image":"https://framerusercontent.com/images/GLnFxH8Vhvi9FBREGytBlmvJHc.png","aspect":0.7234,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/silk-bow-blouse-oxblood"},{"name":"Bias satin skirt","material":"Black silk satin","price":980,"image":"https://framerusercontent.com/images/k0201SzByuCZlRjSuB3AnDm1vw8.png","aspect":0.4558,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/bias-satin-skirt-black"},{"name":"Kitten-heel slingback","material":"Black calf leather, 40 mm","price":690,"image":"https://framerusercontent.com/images/DP1WtRfde9Tdz2vgYX8gFdqbA.png","aspect":2.0108,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/kitten-heel-slingback-black"}]},
{"title":"North Cable","intro":"Hand-linked cashmere, olive gabardine and a soft suede derby. Made for long walks.","image":"https://framerusercontent.com/images/VaNLR4zQRHOO1ZAFdyrzkJRsxk.png","aspect":0.3325,"pieces":[{"name":"Cable cashmere crewneck","material":"Ivory cashmere, hand-linked","price":1450,"image":"https://framerusercontent.com/images/GarSVUmYRcFWvHHR75ts4L1fKE.png","aspect":0.869,"sizes":"S, M, L, XL, XXL","soldOut":"","productLink":"/products/cable-cashmere-crewneck-ivory"},{"name":"Wide trousers","material":"Olive cotton gabardine","price":760,"image":"https://framerusercontent.com/images/yeMtDZ8dWTxH1pzr0uw6m71EbQ.png","aspect":0.4217,"sizes":"46, 48, 50, 52, 54, 56","soldOut":"","productLink":"/products/wide-trousers-olive"},{"name":"Suede derby","material":"Taupe calf suede","price":740,"image":"https://framerusercontent.com/images/APQZl7r1A82MBQutwugzKO9h02A.png","aspect":2.0536,"sizes":"40, 41, 42, 43, 44, 45, 46","soldOut":"","productLink":"/products/suede-derby-taupe"}]},
{"title":"Slate","intro":"One cloth, cut twice: a sharp blazer and a wide trouser in slate twill.","image":"https://framerusercontent.com/images/PQpeM5T2NBw10nVhjvrnzqnquY4.png","aspect":0.2788,"pieces":[{"name":"Tailored wool blazer","material":"Slate wool twill","price":2350,"image":"https://framerusercontent.com/images/kyCyzCebqycrO7ijocTIOgJaK0.png","aspect":0.6712,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/tailored-wool-blazer-slate"},{"name":"Wide tailored trousers","material":"Slate wool twill","price":920,"image":"https://framerusercontent.com/images/fw4KEaql1EZ4FkmgGhNrIwuWUeU.png","aspect":0.3613,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/wide-tailored-trousers-slate"},{"name":"Patent loafer","material":"Black patent calf","price":780,"image":"https://framerusercontent.com/images/vysL301nrG5ubQXWodTU2DniAU.png","aspect":1.7242,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/patent-loafer-black"}]},
{"title":"Trench Weather","intro":"Cream gabardine over a chocolate rib dress. The coat for changeable days.","image":"https://framerusercontent.com/images/dDy7GCPXTbkJzgZkBW74ETxeXoA.png","aspect":0.4768,"pieces":[{"name":"Gabardine trench","material":"Cream cotton gabardine","price":2690,"image":"https://framerusercontent.com/images/5TgCptZeTCVkeEqtu1bJlyUFNA.png","aspect":0.5144,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/gabardine-trench-cream"},{"name":"Ribbed knit dress","material":"Chocolate merino rib","price":1240,"image":"https://framerusercontent.com/images/7Hw3Es8UIxEx1t8lpR14Dm8hDM.png","aspect":0.389,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/ribbed-knit-dress-chocolate"},{"name":"Leather knee boot","material":"Brown calf leather","price":1350,"image":"https://framerusercontent.com/images/mZwSlV2Xlop02GhGTetSJrN7c30.png","aspect":0.7025,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/leather-knee-boot-brown"}]},
{"title":"Navy Hours","intro":"Navy melton, grey flannel, black chelsea boots. The overcoat for the city.","image":"https://framerusercontent.com/images/m1X7Ysfnj1Bx8VGzNG15eSOKCM.png","aspect":0.3028,"pieces":[{"name":"Double-breasted overcoat","material":"Navy wool and cashmere melton","price":3100,"image":"https://framerusercontent.com/images/Hosb3M9knjlImhJquI5y6AnGZQ.png","aspect":0.5569,"sizes":"S, M, L, XL, XXL","soldOut":"","productLink":"/products/double-breasted-overcoat-navy"},{"name":"Flannel trousers","material":"Grey wool flannel","price":820,"image":"https://framerusercontent.com/images/h6PK8hijaIEwUrkQJH8vvJvX8PI.png","aspect":0.353,"sizes":"46, 48, 50, 52, 54, 56","soldOut":"","productLink":"/products/flannel-trousers-grey"},{"name":"Chelsea boot","material":"Black calf leather","price":950,"image":"https://framerusercontent.com/images/j6ZOQr3fKYNUmDy2K2fQXlj9Vs.png","aspect":1.5037,"sizes":"40, 41, 42, 43, 44, 45, 46","soldOut":"","productLink":"/products/chelsea-boot-black"}]},
{"title":"Butter","intro":"Butter cashmere and ecru silk. Soft from neck to ankle.","image":"https://framerusercontent.com/images/KBdiQH5v8QurjTCHsRCuPLk7u98.png","aspect":0.3079,"pieces":[{"name":"Cashmere cardigan","material":"Butter cashmere","price":1280,"image":"https://framerusercontent.com/images/ZGkX0kCJy00VR21miochPtJZl0.png","aspect":0.7356,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/cashmere-cardigan-butter"},{"name":"Silk wide trousers","material":"Ecru silk crêpe","price":1150,"image":"https://framerusercontent.com/images/pqhjCUxE3cBYyWE3iPyAwsgNqk8.png","aspect":0.4051,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/silk-wide-trousers-ecru"},{"name":"Leather ballet flat","material":"Ivory nappa","price":620,"image":"https://framerusercontent.com/images/OtWYv2rCLipJs5CRS93qIsA7IDU.png","aspect":2.8859,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/leather-ballet-flat-ivory"}]},
{"title":"Tobacco","intro":"Tobacco corduroy, cream wool and cognac tassels. Country cloth in town.","image":"https://framerusercontent.com/images/6lUQitXPYhGxfm85DrhM8iTykI.png","aspect":0.3744,"pieces":[{"name":"Corduroy jacket","material":"Tobacco cotton corduroy","price":1690,"image":"https://framerusercontent.com/images/xdPzBTPOlyAwNMuYx9p4OZoe2YM.png","aspect":0.8155,"sizes":"S, M, L, XL, XXL","soldOut":"","productLink":"/products/corduroy-jacket-tobacco"},{"name":"Pleated trousers","material":"Cream wool","price":790,"image":"https://framerusercontent.com/images/7kwybQd0cAlO1ABqHDTAEJwIun8.png","aspect":0.3847,"sizes":"46, 48, 50, 52, 54, 56","soldOut":"","productLink":"/products/pleated-trousers-cream"},{"name":"Tassel loafer","material":"Cognac calf leather","price":830,"image":"https://framerusercontent.com/images/BcGGu7O0W4hVv9ZYHL3yEYJsZ8Y.png","aspect":2.161,"sizes":"40, 41, 42, 43, 44, 45, 46","soldOut":"","productLink":"/products/tassel-loafer-cognac"}]},
{"title":"Velours","intro":"Bottle-green velvet and a black cigarette trouser. Evening, quietly.","image":"https://framerusercontent.com/images/Ye7TT2G9up0XJI7VrvFQ03DFikM.png","aspect":0.294,"pieces":[{"name":"Velvet blazer","material":"Bottle green cotton velvet","price":2450,"image":"https://framerusercontent.com/images/qnZAQfgnRSPla3Ay0sxNeCWf0.png","aspect":0.7622,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/velvet-blazer-bottle-green"},{"name":"Cigarette trousers","material":"Black wool stretch","price":780,"image":"https://framerusercontent.com/images/wnyS7dawBofsuguSJ2H5lhGYfcQ.png","aspect":0.3804,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/cigarette-trousers-black"},{"name":"Pointed ankle boot","material":"Black calf leather, 70 mm","price":1050,"image":"https://framerusercontent.com/images/4z4ChdgOMmVc8dqUH3cw7qGPjYk.png","aspect":1.2525,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/pointed-ankle-boot-black"}]},
{"title":"Nappa","intro":"Black lamb nappa over ecru wool. Simple, and never casual.","image":"https://framerusercontent.com/images/UKXImPsGD5va733WHf1uayASPk.png","aspect":0.3105,"pieces":[{"name":"Nappa zip jacket","material":"Black lamb nappa","price":3400,"image":"https://framerusercontent.com/images/xGURVPw9k0NVvDsPcyYkFZimO9Y.png","aspect":0.7946,"sizes":"S, M, L, XL, XXL","soldOut":"","productLink":"/products/nappa-zip-jacket-black"},{"name":"Wide wool trousers","material":"Ecru wool","price":760,"image":"https://framerusercontent.com/images/fETSgSpJRledYHqB8ERgCE0.png","aspect":0.3819,"sizes":"46, 48, 50, 52, 54, 56","soldOut":"","productLink":"/products/wide-wool-trousers-ecru"},{"name":"Polished derby","material":"Black polished calf","price":790,"image":"https://framerusercontent.com/images/O6Nnrj79qWSQDwpXixjbtKgc.png","aspect":2.1714,"sizes":"40, 41, 42, 43, 44, 45, 46","soldOut":"","productLink":"/products/polished-derby-black"}]},
{"title":"Dove","intro":"Pure cashmere in dove grey, worn long over pale grey crêpe.","image":"https://framerusercontent.com/images/AWkKT97RJ6trbUGg72nt5daxncA.png","aspect":0.3364,"pieces":[{"name":"Cashmere wrap coat","material":"Dove pure cashmere","price":3250,"image":"https://framerusercontent.com/images/jVDS4rMRMt9vbIcum1RapjUZms.png","aspect":0.5131,"sizes":"XS, S, M, L, XL","soldOut":"","productLink":"/products/cashmere-wrap-coat-dove"},{"name":"Fluid wide trousers","material":"Pale grey wool crêpe","price":840,"image":"https://framerusercontent.com/images/Kl2g23gPjLqU4TuKqBqDJRdIA.png","aspect":0.3891,"sizes":"34, 36, 38, 40, 42, 44","soldOut":"","productLink":"/products/fluid-wide-trousers-pale-grey"},{"name":"Penny loafer","material":"Burgundy calf leather","price":780,"image":"https://framerusercontent.com/images/K6QPl0jxT03KsitwbUdPjIKN4A.png","aspect":2.6443,"sizes":"36, 37, 38, 39, 40, 41","soldOut":"","productLink":"/products/penny-loafer-burgundy"}]}]

const WORDMARK_PATHS: string[] = ["M66.64 209.44C45.8773 209.44 29.5573 202.957 17.68 189.992C5.89333 177.027 0 159.483 0 137.36C0 122.491 2.04 108.256 6.12 94.656C10.2 81.056 15.8213 68.4987 22.984 56.984C30.2373 45.4693 38.624 35.4507 48.144 26.928C57.664 18.4053 67.9093 11.7867 78.88 7.07201C89.9413 2.35734 101.275 0 112.88 0C125.845 0 137.315 2.94667 147.288 8.84001C157.352 14.6427 165.24 22.9387 170.952 33.728C176.664 44.5173 179.52 57.3013 179.52 72.08C179.52 90.6667 176.528 108.256 170.544 124.848C164.56 141.349 156.309 155.947 145.792 168.64C135.365 181.333 123.352 191.307 109.752 198.56C96.152 205.813 81.7813 209.44 66.64 209.44ZM66.64 208.896C75.4347 208.896 83.5947 206.629 91.12 202.096C98.6453 197.472 105.445 191.216 111.52 183.328C117.685 175.349 123.125 166.237 127.84 155.992C132.645 145.747 136.635 134.912 139.808 123.488C143.072 111.973 145.52 100.459 147.152 88.944C148.784 77.3387 149.6 66.2773 149.6 55.76C149.6 50.1387 149.011 44.1547 147.832 37.808C146.653 31.4613 144.659 25.4773 141.848 19.856C139.037 14.144 135.275 9.52001 130.56 5.984C125.845 2.35734 119.952 0.544009 112.88 0.544009C104.539 0.544009 96.696 2.85601 89.352 7.48001C82.008 12.0133 75.2533 18.2693 69.088 26.248C62.9227 34.136 57.4373 43.2027 52.632 53.448C47.8267 63.6933 43.7013 74.5733 40.256 86.088C36.9013 97.512 34.3173 109.027 32.504 120.632C30.7813 132.147 29.92 143.163 29.92 153.68C29.92 162.928 31.008 171.768 33.184 180.2C35.36 188.632 39.1227 195.523 44.472 200.872C49.8213 206.221 57.2107 208.896 66.64 208.896Z","M342.678 209.44C335.515 209.44 330.392 207.853 327.31 204.68C324.227 201.416 322.685 197.2 322.685 192.032C322.685 190.037 322.867 188.179 323.23 186.456C323.683 184.643 324.091 183.056 324.453 181.696L341.59 122.944C345.398 109.797 347.392 99.4613 347.573 91.936C347.845 84.4107 345.533 80.648 340.637 80.648C334.019 80.648 327.627 83.3227 321.462 88.672C315.387 94.0213 309.72 101.139 304.461 110.024C299.293 118.819 294.67 128.52 290.59 139.128C286.6 149.645 283.291 160.117 280.661 170.544H280.117C282.747 160.208 286.056 149.691 290.046 138.992C294.126 128.203 298.84 118.275 304.19 109.208C309.539 100.141 315.432 92.8427 321.87 87.312C328.307 81.7813 335.198 79.016 342.542 79.016C350.702 79.016 356.686 80.92 360.493 84.728C364.302 88.4453 366.387 93.3867 366.75 99.552C367.203 105.717 366.341 112.472 364.165 119.816L341.59 198.016C341.318 198.832 341.091 199.739 340.91 200.736C340.819 201.643 340.773 202.595 340.773 203.592C340.773 205.043 341.227 206.176 342.134 206.992C343.131 207.808 344.491 208.216 346.214 208.216C351.382 208.216 356.142 206.811 360.493 204C364.845 201.099 368.971 196.475 372.87 190.128C376.859 183.781 380.758 175.395 384.566 164.968L384.974 165.104C381.075 175.531 377.131 184.008 373.142 190.536C369.243 197.064 364.845 201.869 359.949 204.952C355.144 207.944 349.387 209.44 342.678 209.44ZM178.117 206.72L207.902 82.144H188.997V81.6H229.798L199.878 206.72H178.117ZM250.197 206.72L270.598 122.944C273.862 109.616 275.72 99.2347 276.173 91.8C276.717 84.3653 274.542 80.648 269.646 80.648C263.027 80.648 256.589 83.3227 250.333 88.672C244.077 94.0213 238.275 101.139 232.925 110.024C227.576 118.819 222.816 128.52 218.645 139.128C214.475 149.645 211.075 160.117 208.445 170.544H208.037C210.667 160.208 214.022 149.691 218.102 138.992C222.272 128.203 227.078 118.275 232.518 109.208C238.048 100.141 244.168 92.8427 250.878 87.312C257.587 81.7813 264.795 79.016 272.501 79.016C279.936 79.016 285.422 80.92 288.958 84.728C292.584 88.4453 294.624 93.3867 295.077 99.552C295.621 105.717 294.987 112.472 293.173 119.816L271.822 206.72H250.197Z","M432.956 209.44C425.612 209.44 419.311 207.717 414.052 204.272C408.884 200.736 404.577 196.248 401.132 190.808C397.777 185.368 395.193 179.792 393.38 174.08L439.348 3.26401H416.5V2.72H460.972L412.964 181.016C412.964 189.72 414.097 196.565 416.364 201.552C418.721 206.448 423.98 208.896 432.14 208.896C438.396 208.896 444.289 206.901 449.82 202.912C455.351 198.832 460.383 193.437 464.916 186.728C469.449 180.019 473.348 172.584 476.612 164.424C479.876 156.173 482.369 147.787 484.092 139.264C485.905 130.651 486.812 122.581 486.812 115.056C486.812 104.992 485.18 96.7413 481.916 90.304C478.743 83.8667 474.028 80.648 467.772 80.648C461.969 80.648 456.711 82.4613 451.996 86.088C447.372 89.7147 443.247 94.6107 439.62 100.776C436.084 106.851 432.911 113.651 430.1 121.176C427.38 128.701 424.932 136.363 422.756 144.16H422.212C424.841 134.187 427.743 125.211 430.916 117.232C434.089 109.163 437.58 102.317 441.388 96.696C445.287 90.984 449.639 86.632 454.444 83.64C459.249 80.648 464.553 79.152 470.356 79.152C481.508 79.152 490.62 83.7307 497.692 92.888C504.764 101.955 508.3 113.832 508.3 128.52C508.3 139.128 506.305 149.283 502.316 158.984C498.327 168.685 492.841 177.344 485.86 184.96C478.879 192.485 470.855 198.469 461.788 202.912C452.721 207.264 443.111 209.44 432.956 209.44Z","M515.844 206.72L546.852 82.144H525.636V81.6H567.252L537.332 206.72H515.844ZM547.94 159.664C549.481 153.136 551.34 146.2 553.516 138.856C555.692 131.512 558.185 124.304 560.996 117.232C563.897 110.16 567.161 103.768 570.788 98.056C574.414 92.2533 578.494 87.6293 583.028 84.184C587.561 80.7387 592.593 79.016 598.124 79.016C604.289 79.016 609.094 80.7387 612.54 84.184C616.076 87.5387 617.844 91.528 617.844 96.152C617.844 100.504 616.62 104.267 614.172 107.44C611.814 110.523 608.369 112.064 603.836 112.064C599.393 112.064 595.812 110.613 593.092 107.712C590.372 104.811 589.012 101.229 589.012 96.968C589.012 93.2507 590.281 90.2133 592.82 87.856C595.358 85.408 598.985 84.184 603.7 84.184C607.417 84.184 610.636 85.3173 613.356 87.584C616.166 89.8507 617.572 92.7067 617.572 96.152H617.3C617.3 91.7093 615.622 87.856 612.268 84.592C609.004 81.2373 604.289 79.56 598.124 79.56C592.684 79.56 587.697 81.2827 583.164 84.728C578.721 88.1733 574.686 92.752 571.06 98.464C567.524 104.176 564.35 110.568 561.54 117.64C558.729 124.621 556.236 131.784 554.06 139.128C551.884 146.381 550.025 153.227 548.484 159.664H547.94Z","M653.295 209.44C646.223 209.44 640.964 207.899 637.519 204.816C634.074 201.643 632.351 197.472 632.351 192.304C632.351 190.944 632.442 189.539 632.623 188.088C632.895 186.547 633.212 185.051 633.575 183.6L662.679 82.144H641.463V81.6H684.031L651.119 198.288C650.938 199.013 650.802 199.784 650.711 200.6C650.62 201.325 650.575 202.005 650.575 202.64C650.575 204.181 650.938 205.541 651.663 206.72C652.479 207.808 653.884 208.352 655.879 208.352C661.319 208.352 666.17 206.901 670.431 204C674.783 201.099 678.863 196.475 682.671 190.128C686.57 183.691 690.468 175.304 694.367 164.968L694.775 165.104C690.876 175.531 686.978 184.008 683.079 190.536C679.18 197.064 674.874 201.869 670.159 204.952C665.444 207.944 659.823 209.44 653.295 209.44ZM686.615 34.136C683.623 34.136 680.903 33.4107 678.455 31.96C676.007 30.4187 674.058 28.424 672.607 25.976C671.156 23.4373 670.431 20.672 670.431 17.68C670.431 14.688 671.156 11.968 672.607 9.52001C674.058 6.98134 676.007 4.98667 678.455 3.536C680.903 2.08533 683.623 1.36 686.615 1.36C689.607 1.36 692.327 2.08533 694.775 3.536C697.314 4.98667 699.308 6.98134 700.759 9.52001C702.3 11.968 703.071 14.688 703.071 17.68C703.071 20.672 702.3 23.4373 700.759 25.976C699.308 28.424 697.314 30.4187 694.775 31.96C692.327 33.4107 689.607 34.136 686.615 34.136Z","M795.742 209.44C788.67 209.44 783.321 208.035 779.694 205.224C776.158 202.413 774.39 198.107 774.39 192.304C774.39 190.309 774.572 188.587 774.934 187.136C775.297 185.595 775.66 184.235 776.022 183.056L793.838 122.944C795.924 115.872 797.51 109.253 798.598 103.088C799.686 96.832 799.55 91.7547 798.19 87.856C796.83 83.9573 793.521 82.008 788.262 82.008C783.548 82.008 778.334 84.6373 772.622 89.896C766.91 95.064 761.198 102 755.486 110.704C749.865 119.317 744.697 128.837 739.982 139.264C735.358 149.691 731.732 160.117 729.102 170.544H728.83C730.372 163.835 732.684 156.445 735.766 148.376C738.849 140.216 742.521 132.101 746.782 124.032C751.134 115.872 755.894 108.392 761.062 101.592C766.23 94.792 771.625 89.352 777.246 85.272C782.868 81.1013 788.58 79.016 794.382 79.016C802.27 79.016 808.164 80.92 812.062 84.728C816.052 88.4453 818.364 93.3867 818.998 99.552C819.633 105.717 818.908 112.472 816.822 119.816L794.518 198.152C794.246 198.968 794.02 199.829 793.838 200.736C793.748 201.552 793.702 202.323 793.702 203.048C793.702 204.499 794.065 205.723 794.79 206.72C795.516 207.717 796.876 208.216 798.87 208.216C807.03 208.216 814.057 204.861 819.95 198.152C825.934 191.443 831.828 180.381 837.63 164.968L838.038 165.104C834.14 175.531 830.196 184.008 826.206 190.536C822.308 197.064 817.91 201.869 813.014 204.952C808.209 207.944 802.452 209.44 795.742 209.44ZM698.094 206.72L727.878 82.144H708.294V81.6H750.454L720.534 206.72H698.094Z","M887.738 209.44C879.034 209.44 871.69 207.627 865.706 204C859.722 200.283 855.189 195.16 852.106 188.632C849.023 182.104 847.482 174.533 847.482 165.92C847.482 155.493 849.386 145.157 853.194 134.912C857.002 124.576 862.351 115.192 869.242 106.76C876.133 98.328 884.202 91.5733 893.45 86.496C902.788 81.4187 912.898 78.88 923.778 78.88C933.57 78.88 941.141 81.328 946.49 86.224C951.93 91.0293 954.65 97.0133 954.65 104.176C954.65 111.611 952.111 118.139 947.034 123.76C941.957 129.381 935.157 134.141 926.634 138.04C918.202 141.848 908.863 144.84 898.618 147.016C888.463 149.192 878.218 150.643 867.882 151.368V150.824C876.133 150.28 883.703 149.283 890.594 147.832C897.575 146.291 903.741 144.205 909.09 141.576C914.53 138.947 919.109 135.683 922.826 131.784C926.634 127.795 929.535 123.035 931.53 117.504C933.525 111.973 934.522 105.581 934.522 98.328C934.522 93.704 933.615 89.3973 931.802 85.408C930.079 81.4187 926.77 79.424 921.874 79.424C916.706 79.424 911.765 80.9653 907.05 84.048C902.426 87.1307 898.074 91.3467 893.994 96.696C890.005 101.955 886.378 107.984 883.114 114.784C879.85 121.493 877.039 128.565 874.682 136C872.415 143.435 870.647 150.824 869.378 158.168C868.199 165.512 867.61 172.403 867.61 178.84C867.61 190.264 869.695 198.061 873.866 202.232C878.127 206.403 883.431 208.488 889.778 208.488C897.847 208.488 905.237 206.811 911.946 203.456C918.746 200.101 924.775 195.659 930.034 190.128C935.383 184.507 939.826 178.296 943.362 171.496L943.77 171.632C940.234 178.523 935.746 184.824 930.306 190.536C924.957 196.248 918.701 200.827 911.538 204.272C904.466 207.717 896.533 209.44 887.738 209.44Z"]


/* --------------------------------------------------------------- helpers */
const srcOf = (img: Look["image"]) => (typeof img === "string" ? img : img?.src || "")
const ASPECTS: Record<string, number> = Object.fromEntries(DEFAULT_LOOKS.flatMap((l) => [[srcOf(l.image), l.aspect || 0.36], ...l.pieces.map((p) => [srcOf(p.image), p.aspect || 0.6])]))
const sized = (url: string, px: number) => (url && url.includes("framerusercontent.com/images/") && !url.includes("?") ? `${url}?scale-down-to=${px}` : url)
const splitList = (s: string) =>
    (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
const slugOf = (p: Piece) => (p.productLink ? p.productLink.split("/").filter(Boolean).pop() || "" : p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
const sizeType = (p: Piece) => {
    const s = splitList(p.sizes)
    if (!s.length) return "none"
    return isNaN(Number(s[0])) ? "letters" : `n${s[0]}`
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const smoothstep = (t: number) => t * t * (3 - 2 * t)
function mulberry32(a: number) {
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function seededPerm(n: number, seed: number) {
    const r = mulberry32(seed)
    const a = Array.from({ length: n }, (_, i) => i)
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
const mod = (a: number, n: number) => ((a % n) + n) % n

/* ---------------------------------------------------------- wall geometry */
// Positions are in design units (desktop 1440 × 900, mobile 390 × 844).
type PlaneKey = "far" | "back" | "mid" | "front"
interface PlaneGeo {
    key: PlaneKey
    spacing: number
    offset: number
    y: number
    jitterY: number
    parallax: number
    seed: number
}
const GEO_DESKTOP: PlaneGeo[] = [
    { key: "far", spacing: 226, offset: 200, y: 86, jitterY: 6, parallax: 0.35, seed: 11 },
    { key: "back", spacing: 241, offset: 95, y: 116, jitterY: 9, parallax: 0.6, seed: 23 },
    { key: "mid", spacing: 274, offset: 178, y: 362, jitterY: 9, parallax: 1, seed: 7 },
    { key: "front", spacing: 1396, offset: 22, y: 350, jitterY: 6, parallax: 1.4, seed: 41 },
]
const GEO_MOBILE: PlaneGeo[] = [
    { key: "far", spacing: 99, offset: 48, y: 95, jitterY: 4, parallax: 0.35, seed: 11 },
    { key: "back", spacing: 106, offset: 38, y: 170, jitterY: 6, parallax: 0.6, seed: 23 },
    { key: "mid", spacing: 123, offset: 72, y: 400, jitterY: 6, parallax: 1, seed: 7 },
    { key: "front", spacing: 416, offset: -12, y: 405, jitterY: 4, parallax: 1.4, seed: 41 },
]
const WORDMARK_GEO = {
    desktop: { w: 955, y: 196, cx: 722 },
    mobile: { w: 336, y: 280, cx: 196 },
}
const WORDMARK_RATIO = 209.44 / 954.65
const LOGO = {
    desktop: { w: 156, top: 29 },
    mobile: { w: 104, top: 23 },
}

// The opening composition from the design (0-based look numbers, left to right).
// Every sequence holds each look once, so neighbours never repeat.
const FIGMA_ORDER: Record<PlaneKey, number[]> = {
    far: [4, 8, 1, 11, 3, 5, 0, 2, 6, 7, 9, 10],
    back: [1, 3, 8, 11, 4, 10, 0, 2, 5, 6, 7, 9],
    mid: [0, 2, 6, 7, 9, 4, 11, 1, 8, 3, 10, 5],
    front: [5, 10, 0, 2, 6, 9, 1, 7, 3, 11, 4, 8],
}

// Rows rotate through depth. rel 0 is the row in focus, -1 the row by the
// screen, 1 and 2 the rows behind. A row leaving past the screen (rel < -1.5)
// re-enters at the very back (rel 2.5), invisible at both ends of the loop.
const HOME_REL = [2, 1, 0, -1] // far, back, mid, front at rest
const MID_ROW = 2
const wrapRel = (v: number) => mod(v + 1.5, 4) - 1.5
type Keys = [number, number][]
const lerpKeys = (keys: Keys, x: number) => {
    if (x <= keys[0][0]) return keys[0][1]
    for (let i = 1; i < keys.length; i++) {
        if (x <= keys[i][0]) {
            const [x0, y0] = keys[i - 1]
            const [x1, y1] = keys[i]
            return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
        }
    }
    return keys[keys.length - 1][1]
}

// Hint for the depth scroll, per site language (the old zoom label is ignored)
const SCROLL_HINT: Record<string, string> = {
    en: "Scroll to move through",
    fr: "Défilez pour avancer",
    es: "Desplaza para avanzar",
    ru: "Прокрутите, чтобы пройти вглубь",
    zh: "滚动以穿行",
    ar: "مرّر للتنقّل بين الصفوف",
}
const OLD_ZOOM_HINTS = ["Scroll to zoom", "Défilez pour zoomer", "Desplaza para ampliar", "Прокрутите для масштаба", "滚动以缩放", "مرّر للتكبير"]

/* ---------------------------------------------------------------- Salon */
/**
 * Salon — the Ombrine home hero. Twelve looks on a wall in four depth planes.
 *
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Salon(props: SalonProps) {
    const {
        source = "cms",
        wordmark,
        season = "Autumn–Winter 2026, twelve looks",
        seasonLink = "",
        labels: labelsProp,
        planes: planesProp,
        autoScroll = 24,
        direction = "rtl",
        motionSpeed = 1,
        showIntro = true,
        showMinimap = true,
        idleDrift = true,
        cursorView = true,
        style,
    } = props
    const labels: Labels = { ...DEFAULT_LABELS, ...(labelsProp || {}) }
    const planes: Planes = { ...DEFAULT_PLANES, ...(planesProp || {}) }
    const [measured, setMeasured] = useState<Record<string, number>>({})
    const bare = (s: string) => s.split("?")[0]
    const withAspect = (l: Look): Look => ({ ...l, aspect: l.aspect || ASPECTS[bare(srcOf(l.image))] || measured[srcOf(l.image)] || 0.36 })
    // Looks come from the CMS (Looks + their Products) through the hidden
    // Salon Index lists on the page; the built-in sample is the fallback.
    const index = useSalonIndex() as unknown as {
        looks: Record<string, { code: string; slug?: string; title: string; intro: string; image: string; order: number }>
        pieces: Record<string, { slug: string; look: string; name: string; material: string; price: number; image: string; sizes: string; soldOut: string; order: number }>
    }
    // Shopify, when connected, decides each piece's price and sold-out sizes
    const liveMap = useLiveMap(Object.values(index.pieces).map((p) => p.slug))
    const cmsLooks = useMemo(() => {
        const byLook: Record<string, Piece[]> = {}
        Object.values(index.pieces)
            .sort((a, b) => a.order - b.order)
            .forEach((p) => {
                ;(byLook[p.look] = byLook[p.look] || []).push({ name: p.name, material: p.material, price: livePrice(liveMap[p.slug], p.price), image: p.image, sizes: liveSizes(liveMap[p.slug], splitList(p.sizes)).join(", "), soldOut: liveSold(liveMap[p.slug], liveSizes(liveMap[p.slug], splitList(p.sizes)), splitList(p.soldOut)).join(", "), productLink: `/products/${p.slug}` })
            })
        return Object.values(index.looks)
            .filter((l) => l.image)
            .sort((a, b) => a.order - b.order)
            .map((l): Look => ({ title: l.title, slug: l.slug, intro: l.intro, image: l.image, pieces: (byLook[l.code] || []).slice(0, 3) }))
    }, [index, liveMap])
    const looks: Look[] = (source !== "sample" && cmsLooks.length ? cmsLooks : DEFAULT_LOOKS).slice(0, 48).map(withAspect)
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const lang = useLang()
    const goTo = useNavigate()

    const rootRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 1440, h: 900 })
    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            // layout size, not the on-screen rect: the editor canvas scales the page with its zoom
            const r = { width: el.offsetWidth, height: el.offsetHeight }
            if (r.width > 0 && r.height > 0) setSize((s) => (Math.abs(s.w - r.width) > 0.5 || Math.abs(s.h - r.height) > 0.5 ? { w: r.width, h: r.height } : s))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    const mobile = size.w < 810
    const base = mobile ? { w: 390, h: 844 } : { w: 1440, h: 900 }
    const u = size.h / base.h // design unit → px
    const geo = mobile ? GEO_MOBILE : GEO_DESKTOP
    const heights: Record<PlaneKey, number> = mobile
        ? { far: (planes.farHeight * 70) / 120, back: (planes.backHeight * 130) / 210, mid: (planes.midHeight * 250) / 340, front: (planes.frontHeight * 520) / 700 }
        : { far: planes.farHeight, back: planes.backHeight, mid: planes.midHeight, front: planes.frontHeight }
    const blurs: Record<PlaneKey, number> = { far: planes.farBlur, back: planes.backBlur, mid: 0, front: planes.frontBlur }
    const opac: Record<PlaneKey, number> = { far: planes.farOpacity, back: planes.backOpacity, mid: 1, front: 1 }

    // seeded shuffle per row: neighbours never repeat, same layout on every visit
    const perms = useMemo(() => {
        const n = looks.length || 1
        if (n === 12) return FIGMA_ORDER
        const out: Record<PlaneKey, number[]> = {} as any
        geo.forEach((g) => (out[g.key] = seededPerm(n, g.seed + n)))
        return out
    }, [looks.length, mobile])
    const jitter = (g: PlaneGeo, i: number) => (mulberry32(g.seed * 1000 + i * 17)() - 0.5) * 2 * g.jitterY
    const lookAt = (r: number, i: number) => perms[geo[r].key][mod(i, looks.length || 1)]
    // each row keeps its own horizontal rhythm, measured in figure slots
    const phaseOf = (g: PlaneGeo) => (g.offset - base.w / 2) / g.spacing

    // depth profile: height, spacing, top, blur, opacity and parallax by rel
    const [gFar, gBack, gMid, gFront] = geo
    // the row by the screen stands lower than the focus row, so its heads sit below theirs
    const frontY = gFront.y + (planes.frontDrop || 0) * (mobile ? 0.65 : 1)
    const prof = {
        h: [[-2, heights.front * 1.45], [-1, heights.front], [0, heights.mid], [1, heights.back], [2, heights.far], [3, heights.far * 0.7]] as Keys,
        sp: [[-2, gFront.spacing * 1.35], [-1, gFront.spacing], [0, gMid.spacing], [1, gBack.spacing], [2, gFar.spacing], [3, gFar.spacing * 0.9]] as Keys,
        y: [[-2, frontY + 90], [-1, frontY], [0, gMid.y], [1, gBack.y], [2, gFar.y], [3, gFar.y - 14]] as Keys,
        blur: [[-2, blurs.front * 2.5 + 2], [-1, blurs.front], [0, 0], [1, blurs.back], [2, blurs.far], [3, blurs.far * 1.6]] as Keys,
        op: [[-1.5, 0], [-1, 1], [0, 1], [1, opac.back], [2, opac.far], [2.5, 0]] as Keys,
        par: [[-2, 1.8], [-1, gFront.parallax], [0, 1], [1, gBack.parallax], [2, gFar.parallax], [3, 0.25]] as Keys,
    }
    const profRef = useRef(prof)
    profRef.current = prof
    // figures render at the focus-row height and scale to their row's depth
    const refH = heights.mid * u
    const aspects = looks.map((l) => l.aspect || 0.36)
    const aspectRef = useRef(aspects)
    aspectRef.current = aspects
    const minSp = Math.min(...prof.sp.map((k) => k[1]))
    // pool per row: enough to cover the widest spacing-dense view
    const pool = Math.ceil(size.w / 0.9 / (minSp * u)) + 3

    /* ----------------------------------------------------- camera (refs) */
    // d: depth position (rows), td: target row, dv: depth velocity
    const cam = useRef({ x: 0, y: 0, z: 1, tx: 0, ty: 0, vx: 0, vy: 0, breath: 0, intro: 1, d: 0, td: 0, dv: 0, dolly: false, drift: 0 })
    // auto-scroll in px/s (design units); positive walks the looks right to left
    const driftRef = useRef(0)
    driftRef.current = Math.max(0, autoScroll || 0) * (direction === "ltr" ? -1 : 1)
    const pointer = useRef({ x: -9999, y: -9999, inside: false, down: false, sx: 0, sy: 0, moved: 0, lastX: 0, lastY: 0, lastT: 0, id: -1, axis: "" })
    const lastInput = useRef(0)
    const [bases, setBases] = useState<number[]>([-2, -2, -2, -2])
    const basesRef = useRef(bases)
    basesRef.current = bases
    const pan = useRef([0, 0, 0, 0]) // per-row pan in slots
    const lastCx = useRef(0)
    const [restD, setRestD] = useState(0) // the row depth the wall is heading to
    const restDRef = useRef(restD)
    restDRef.current = restD
    const worldRef = useRef<HTMLDivElement>(null)
    const rowWrapRefs = useRef<(HTMLDivElement | null)[]>([])
    const rowRefs = useRef<(HTMLDivElement | null)[][]>([[], [], [], []])
    const leanRefs = useRef<(HTMLDivElement | null)[][]>([[], [], [], []])
    const lean = useRef<Record<string, { x: number; s: number }>>({})
    const wordRef = useRef<HTMLDivElement>(null)
    const captionRef = useRef<HTMLDivElement>(null)
    const viewRectRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)

    const [hover, setHover] = useState<{ r: number; k: number; look: number } | null>(null)
    const hoverRef = useRef(hover)
    hoverRef.current = hover
    const [open, setOpen] = useState<null | { look: number; orig: number; from: DOMRect | null; slotK: number; slotR: number }>(null)
    const openRef = useRef(open)
    openRef.current = open
    const [closing, setClosing] = useState(false)
    const [focusK, setFocusK] = useState<number | null>(null)

    const speed = clamp(motionSpeed || 1, 0.5, 1.5) * (mobile ? 1.25 : 1)
    const d = (s: number) => s / speed // duration helper (mobile intro runs at 0.8×)
    const relAt = (r: number, depth: number) => wrapRel(HOME_REL[r] - depth)
    const settled = () => Math.abs(cam.current.d - cam.current.td) < 0.05

    /* ------------------------------------------------------ frame layout */
    // x of slot i in row r: W/2 + (phase + i - pan) * spacing; it scales about
    // the screen centre as the row moves in depth, so nothing whips sideways.
    const slotPos = (r: number, i: number, depth: number, P: number, cy: number) => {
        const g = geo[r]
        const pr = profRef.current
        const rel = relAt(r, depth)
        const sp = lerpKeys(pr.sp, rel) * u
        const par = reduced ? 1 : lerpKeys(pr.par, rel)
        const s = (lerpKeys(pr.h, rel) * u) / refH
        const a = aspectRef.current[lookAt(r, i)] || 0.36
        const vy0 = (size.h - base.h * u) / 2
        const x = size.w / 2 + (phaseOf(g) + i - P) * sp - (a * refH * s) / 2
        const y = vy0 + (lerpKeys(pr.y, rel) + jitter(g, i)) * u - cy * par
        return `translate3d(${x}px, ${y}px, 0) scale(${s})`
    }
    const rowLook = (r: number, depth: number) => {
        const pr = profRef.current
        const rel = relAt(r, depth)
        const op = lerpKeys(pr.op, rel)
        const bl = lerpKeys(pr.blur, rel)
        return { opacity: op, filter: bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none", zIndex: Math.round((3 - rel) * 10), visibility: (op < 0.004 ? "hidden" : "visible") as "hidden" | "visible" }
    }

    const layoutFrame = useCallback(() => {
        const c = cam.current
        const W = size.w,
            H = size.h
        const vy0 = (H - base.h * u) / 2
        // the world only breathes and settles (no zoom); scale about the centre
        const z = (1 + c.breath) * c.intro
        c.tx = (W / 2) * (1 - z)
        c.ty = (H / 2) * (1 - z)
        const world = worldRef.current
        if (world) world.style.transform = `translate3d(${c.tx}px, ${c.ty}px, 0) scale(${z})`
        const visL = (0 - c.tx) / z
        const dx = c.x - lastCx.current
        lastCx.current = c.x
        const pr = profRef.current
        const nextBases: number[] = []
        let changed = false
        geo.forEach((g, r) => {
            const rel = relAt(r, c.d)
            const sp = lerpKeys(pr.sp, rel) * u
            const par = reduced ? 1 : lerpKeys(pr.par, rel)
            pan.current[r] += (dx * par) / sp
            const P = pan.current[r]
            const hh = lerpKeys(pr.h, rel) * u
            const first = Math.floor((visL - W / 2 - hh) / sp + P - phaseOf(g)) - 1
            nextBases[r] = first
            if (first !== basesRef.current[r]) changed = true
            const wrap = rowWrapRefs.current[r]
            if (wrap) {
                const lk = rowLook(r, c.d)
                wrap.style.opacity = lk.opacity.toFixed(3)
                wrap.style.filter = lk.filter
                wrap.style.zIndex = String(lk.zIndex)
                wrap.style.visibility = lk.visibility
            }
            const els = rowRefs.current[r]
            const b = basesRef.current[r]
            for (let k = 0; k < els.length; k++) {
                const el = els[k]
                if (el) el.style.transform = slotPos(r, b + k, c.d, P, c.y)
            }
        })
        if (changed) {
            basesRef.current = nextBases
            startTransition(() => setBases(nextBases))
        }
        // the opening wordmark on the wall (parallax 0.8)
        const wg = mobile ? WORDMARK_GEO.mobile : WORDMARK_GEO.desktop
        if (wordRef.current) {
            const par = reduced ? 1 : 0.8
            const x = W / 2 + (wg.cx - wg.w / 2 - base.w / 2) * u - c.x * par
            const y = vy0 + wg.y * u - c.y * par
            wordRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
        }
        // minimap viewport: one period of the mid plane = all looks once
        if (viewRectRef.current) {
            const mid = geo[MID_ROW]
            const period = mid.spacing * u * (looks.length || 1)
            const frac = mod(c.x, period) / period
            const wFrac = clamp(W / z / period, 0.08, 1)
            viewRectRef.current.style.transform = `translate3d(${frac * 84 - (wFrac * 84) / 2}px, ${clamp(c.y / 240, -1, 1) * 6}px, 0)`
            viewRectRef.current.style.width = `${wFrac * 84}px`
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.w, size.h, u, mobile, geo, reduced, looks.length, refH])

    // initial static layout
    useLayoutEffect(() => {
        layoutFrame()
    }, [layoutFrame, bases])

    /* ------------------------------------------------------------ the loop */
    useEffect(() => {
        if (isStatic) return
        let raf = 0
        let last = performance.now()
        lastInput.current = last
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const c = cam.current
            const p = pointer.current
            const isOpen = !!openRef.current
            if (!isOpen && !p.down) {
                // inertia
                if (Math.abs(c.vx) > 0.08 || Math.abs(c.vy) > 0.08) {
                    c.x -= c.vx / c.z
                    c.y = clamp(c.y - c.vy / c.z, -120, 120)
                    c.vx *= 0.94
                    c.vy *= 0.94
                } else {
                    c.vx = c.vy = 0
                }
                // idle breathing
                if (idleDrift && !reduced && now - lastInput.current > 4000) {
                    const t = ((now - lastInput.current - 4000) / 12000) * Math.PI * 2
                    c.breath = 0.006 * (1 - Math.cos(t))
                } else if (c.breath !== 0) {
                    c.breath = 0
                }
            }
            // the wall walks on by itself; it eases to a stop on hover, drag or an open look
            const driftTarget = isOpen || p.down || hoverRef.current || reduced ? 0 : driftRef.current * u
            c.drift += (driftTarget - c.drift) * (1 - Math.exp(-dt / 0.5))
            if (Math.abs(c.drift) > 0.01) c.x += c.drift * dt
            // depth: a critically damped spring toward the target row
            if (!c.dolly) {
                if (reduced) {
                    c.d = c.td
                    c.dv = 0
                } else if (Math.abs(c.td - c.d) > 0.0004 || Math.abs(c.dv) > 0.001) {
                    const w = 7.2 * speed
                    c.dv += (w * w * (c.td - c.d) - 2 * w * c.dv) * dt
                    c.d += c.dv * dt
                } else {
                    c.d = c.td
                    c.dv = 0
                }
            }
            layoutFrame()
            // near-cursor lean on the focus row + neighbour push on hover
            const h = hoverRef.current
            const focusR = geo.findIndex((_, r) => Math.abs(relAt(r, restDRef.current)) < 0.01)
            for (let r = 0; r < leanRefs.current.length; r++) {
                const els = leanRefs.current[r]
                for (let k = 0; k < els.length; k++) {
                    const el = els[k]
                    if (!el) continue
                    const key = `${r}:${k}`
                    const st = (lean.current[key] = lean.current[key] || { x: 0, s: 1 })
                    let tx = 0,
                        ts = 1
                    if (r === focusR && !isOpen && p.inside && !mobile && !reduced && settled()) {
                        const rc = el.getBoundingClientRect()
                        const cx = rc.left + rc.width / 2,
                            cy = rc.top + rc.height / 2
                        const root = rootRef.current!.getBoundingClientRect()
                        const ddx = cx - (root.left + p.x),
                            ddy = cy - (root.top + p.y)
                        const dist = Math.hypot(ddx, ddy)
                        if (dist < 280) {
                            const t = smoothstep(1 - dist / 280)
                            tx = Math.sign(ddx || 1) * 6 * t
                            ts = 1 + 0.03 * t
                        }
                        if (h && h.r === r && !isOpen) {
                            if (k === h.k) tx = 0
                            else if (k === h.k - 1) tx = -9
                            else if (k === h.k + 1) tx = 9
                        }
                    }
                    if (Math.abs(tx - st.x) < 0.01 && Math.abs(ts - st.s) < 0.0001) continue
                    const a = 1 - Math.exp(-dt / 0.2)
                    st.x += (tx - st.x) * a
                    st.s += (ts - st.s) * a
                    el.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0) scale(${st.s.toFixed(4)})`
                }
            }
            // caption follows the hovered look
            if (captionRef.current && h) {
                const el = rowRefs.current[h.r]?.[h.k]
                const root = rootRef.current
                if (el && root) {
                    const rc = el.getBoundingClientRect(),
                        rr = root.getBoundingClientRect()
                    captionRef.current.style.transform = `translate3d(${rc.left - rr.left + rc.width / 2}px, ${rc.top - rr.top + rc.height + 14}px, 0) translateX(-50%)`
                }
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, layoutFrame, idleDrift, reduced, mobile, u, speed])

    /* ---------------------------------------------------------- the intro */
    // After Boutique: the wordmark lands letter by letter, holds, dissolves
    // letter by letter and lands again small at the header centre. Meanwhile
    // every figure develops out of blur in random order and the camera dollies in.
    const introAnims = useRef<Animation[]>([])
    const [introDone, setIntroDone] = useState(!showIntro)
    const [wordGone, setWordGone] = useState(!showIntro)
    const introDoneRef = useRef(introDone)
    introDoneRef.current = introDone
    const devRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const letterRefs = useRef<(SVGSVGElement | null)[]>([])
    const smallLetterRefs = useRef<(SVGSVGElement | null)[]>([])
    const smallRef = useRef<HTMLDivElement>(null)
    const chromeRef = useRef<HTMLDivElement>(null)
    const groundRef = useRef<HTMLDivElement>(null)
    const ffRef = useRef(false)
    const goRef = useRef<null | (() => void)>(null)
    const imagesReadyRef = useRef(false)
    const fastForward = useCallback(() => {
        introAnims.current.forEach((a) => {
            try {
                const timing = a.effect?.getComputedTiming()
                const end = (timing?.endTime as number) || 0
                const cur = Number(a.currentTime || 0)
                const remaining = end - cur
                if (remaining > 600 && a.playState !== "finished") a.updatePlaybackRate(remaining / 600)
            } catch (e) {}
        })
    }, [])

    useEffect(() => {
        if (isStatic) return
        const anims: Animation[] = []
        const timers: number[] = []
        const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
        const ease = (b: number[]) => `cubic-bezier(${b.join(",")})`
        const OUT3 = ease([0.215, 0.61, 0.355, 1]) // power3.out
        const IN3 = ease([0.55, 0.055, 0.675, 0.19]) // power3.in
        const run = (el: Element | null | undefined, kf: Keyframe[], o: KeyframeAnimationOptions) => {
            if (!el || !(el as any).animate) return
            anims.push((el as HTMLElement).animate(kf, { fill: "both", ...o }))
        }
        if (!showIntro) {
            setIntroDone(true)
            setWordGone(true)
            return
        }
        // crossing a breakpoint later must not replay the opening
        if (introDoneRef.current) return
        if (reduced) {
            setWordGone(true)
            run(rootRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 })
            introAnims.current = anims
            later(() => setIntroDone(true), 650)
            return () => timers.forEach((t) => window.clearTimeout(t))
        }
        const c = cam.current
        const DOLLY = 0.45 // rows start this far back and walk in
        c.dolly = true
        c.d = c.td - DOLLY
        c.dv = 0
        c.intro = 0.92
        let raf = 0
        const startIntro = () => {
            const big = letterRefs.current.filter(Boolean) as Element[]
            const bigEls: Element[] = big.length ? big : wordRef.current ? [wordRef.current] : []
            const small = smallLetterRefs.current.filter(Boolean) as Element[]
            const smallEls: Element[] = small.length ? small : smallRef.current ? [smallRef.current] : []
            const off = (blur: number, p: number) => ({ opacity: 0, filter: `blur(${blur}px)`, transform: `perspective(${p}px) rotateY(45deg) scale(0.85)` })
            const on = (p: number) => ({ opacity: 1, filter: "blur(0px)", transform: `perspective(${p}px) rotateY(0deg) scale(1)` })
            // 0.00 ground and studio light
            run(groundRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: d(600), easing: ease(EASE.entrance) })
            // 0.12 big letters land, last letter first
            const T0 = 120
            bigEls
                .slice()
                .reverse()
                .forEach((el, i) => run(el, [off(14, 480), on(480)], { duration: d(1100), delay: d(T0 + i * 70), easing: OUT3 }))
            // 0.12 every look develops out of blur in random order
            const keys = Object.keys(devRefs.current).filter((k) => devRefs.current[k])
            seededPerm(keys.length, 99).forEach((ki, rank) =>
                run(devRefs.current[keys[ki]], [{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)" }], { duration: d(950), delay: d(T0 + rank * 40), easing: OUT3 })
            )
            // 0.12 the camera dollies in (power4.out, 1.6 s)
            const from = c.d
            let prog = 0
            let lastT = performance.now()
            const startAt = lastT + d(T0)
            const step = (now: number) => {
                const dt = now - lastT
                lastT = now
                if (now >= startAt) prog = Math.min(1, prog + (dt / d(1600)) * (ffRef.current ? 4 : 1))
                const e = 1 - Math.pow(1 - prog, 4)
                c.d = from + (c.td - from) * e
                c.intro = 0.92 + 0.08 * e
                if (prog < 1) raf = requestAnimationFrame(step)
                else {
                    c.intro = 1
                    c.dolly = false
                }
            }
            raf = requestAnimationFrame(step)
            // teleport: hold 0.5 s, then the letters dissolve first to last
            const TP = T0 + (bigEls.length - 1) * 70 + 1100 + 500
            bigEls.forEach((el, i) => run(el, [on(480), off(14, 480)], { duration: d(950), delay: d(TP + i * 50), easing: IN3, fill: "forwards" }))
            // ...and land again, small, at the header centre
            smallEls
                .slice()
                .reverse()
                .forEach((el, i) => run(el, [off(2, 180), on(180)], { duration: d(1150), delay: d(TP + 650 + i * 70), easing: OUT3 }))
            later(() => setWordGone(true), d(TP + 1300))
            // footer row
            run(chromeRef.current, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0px)" }], { duration: d(900), delay: d(2200), easing: ease(EASE.entrance) })
            introAnims.current = anims
            later(() => setIntroDone(true), d(TP + 650 + (smallEls.length - 1) * 70 + 1150))
        }
        // the intro waits until the CMS looks are in and every cut-out has
        // downloaded (see the preload effect below), or 6 s at most
        let started = false
        let cancelled = false
        const go = () => {
            if (started || cancelled) return
            started = true
            goRef.current = null
            startIntro()
        }
        goRef.current = go
        if (imagesReadyRef.current) go()
        later(go, 6000)
        // hide everything until it starts
        const hidden: (Element | null)[] = [...Object.values(devRefs.current), ...letterRefs.current, ...smallLetterRefs.current, chromeRef.current]
        hidden.forEach((el) => el && ((el as HTMLElement).style.opacity = "0"))
        return () => {
            cancelled = true
            timers.forEach((t) => window.clearTimeout(t))
            cancelAnimationFrame(raf)
            c.dolly = false
            c.intro = 1
            anims.forEach((a) => a.cancel())
            hidden.forEach((el) => el && ((el as HTMLElement).style.opacity = ""))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, showIntro, reduced, mobile])
    // preload: give the CMS a moment to hand over its looks, then download every
    // distinct cut-out at the size the wall uses, and only then start the opening
    const [cmsWaitOver, setCmsWaitOver] = useState(false)
    useEffect(() => {
        if (isStatic) return
        const t = window.setTimeout(() => setCmsWaitOver(true), 1500)
        return () => window.clearTimeout(t)
    }, [isStatic])
    const cmsPending = source !== "sample" && cmsLooks.length === 0 && !cmsWaitOver
    const looksKey = looks.map((l) => srcOf(l.image)).join("|")
    useEffect(() => {
        if (isStatic || cmsPending || imagesReadyRef.current) return
        let alive = true
        const urls = Array.from(new Set(looks.map((l) => sized(srcOf(l.image), 1024)).filter(Boolean)))
        const load = (src: string) =>
            new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = img.onerror = () => resolve()
                img.src = src
                if (img.decode) img.decode().then(() => resolve(), () => resolve())
            })
        Promise.all(urls.map(load)).then(() => {
            if (!alive) return
            imagesReadyRef.current = true
            goRef.current?.()
        })
        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, cmsPending, looksKey])
    const anyInput = useCallback(() => {
        lastInput.current = performance.now()
        cam.current.breath = 0
        if (!introDone && !ffRef.current) {
            ffRef.current = true
            fastForward()
        }
    }, [introDone, fastForward])

    /* ------------------------------------------------------ input: depth */
    // +1: walk in to the row behind; -1: the row by the screen steps back into focus
    const stepDepth = useCallback(
        (dir: number) => {
            if (openRef.current) return
            anyInput()
            const c = cam.current
            c.td = Math.round(c.td) + dir
            setHover(null)
            setFocusK(null)
            setRestD(c.td)
        },
        [anyInput]
    )

    /* ------------------------------------------------------- input: drag */
    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic || openRef.current) return
        anyInput()
        const p = pointer.current
        p.down = true
        p.sx = p.lastX = e.clientX
        p.sy = p.lastY = e.clientY
        p.lastT = performance.now()
        p.moved = 0
        p.axis = ""
        p.id = e.pointerId
        cam.current.vx = cam.current.vy = 0
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const p = pointer.current
        const r = rootRef.current!.getBoundingClientRect()
        p.x = e.clientX - r.left
        p.y = e.clientY - r.top
        p.inside = true
        if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
        // a mouse merely passing over the page must not fast-forward the opening
        lastInput.current = performance.now()
        cam.current.breath = 0
        if (!p.down || openRef.current) return
        const tdx = e.clientX - p.sx,
            tdy = e.clientY - p.sy
        p.moved = Math.max(p.moved, Math.hypot(tdx, tdy))
        // on phones a mostly vertical swipe steps the rows instead of panning
        if (!p.axis && p.moved > 10) p.axis = Math.abs(tdy) > Math.abs(tdx) ? "y" : "x"
        const dx = mobile && p.axis === "y" ? 0 : e.clientX - p.lastX
        const dy = mobile ? 0 : e.clientY - p.lastY
        if (p.moved > 6 && (dx || dy)) {
            if (!(e.target as any).hasPointerCapture?.(e.pointerId)) {
                try {
                    rootRef.current?.setPointerCapture(e.pointerId)
                } catch (err) {}
            }
            const c = cam.current
            c.x -= dx / c.z
            c.y = clamp(c.y - dy / c.z, -120, 120)
            const now = performance.now()
            const f = Math.max(1, (now - p.lastT) / 16.67)
            c.vx = c.vx * 0.5 + (dx / f) * 0.5
            c.vy = c.vy * 0.5 + (dy / f) * 0.5
            p.lastT = now
        }
        p.lastX = e.clientX
        p.lastY = e.clientY
    }
    const onPointerUp = (e: React.PointerEvent) => {
        const p = pointer.current
        const wasDown = p.down
        p.down = false
        try {
            rootRef.current?.releasePointerCapture(e.pointerId)
        } catch (err) {}
        if (performance.now() - p.lastT > 80) cam.current.vx = cam.current.vy = 0
        if (wasDown && mobile && p.axis === "y") {
            const dy = e.clientY - p.sy
            if (Math.abs(dy) > 50) stepDepth(dy < 0 ? 1 : -1)
        }
    }
    const onPointerLeave = () => {
        pointer.current.inside = false
        pointer.current.down = false
    }

    // wheel: one row per gesture; a trackpad's momentum tail does not count twice
    useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el) return
        let acc = 0
        let lastWheel = 0
        let lastStep = 0
        let locked = false
        const onWheel = (e: WheelEvent) => {
            if (openRef.current) return
            e.preventDefault()
            const now = performance.now()
            if (now - lastWheel > 160) {
                acc = 0
                locked = false
            }
            lastWheel = now
            if (locked && now - lastStep < 900) return
            acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
            if (Math.abs(acc) >= 40) {
                stepDepth(acc > 0 ? 1 : -1)
                acc = 0
                locked = true
                lastStep = now
            }
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic, stepDepth])

    // keyboard: ← → pan the wall, ↑ ↓ step the rows, ← → change look when open, Esc closes
    useEffect(() => {
        if (isStatic) return
        const onKey = (e: KeyboardEvent) => {
            anyInput()
            const o = openRef.current
            if (o) {
                if (e.key === "Escape") close()
                else if (e.key === "ArrowRight") step(1)
                else if (e.key === "ArrowLeft") step(-1)
                return
            }
            const inside = rootRef.current?.contains(document.activeElement)
            if (!inside) return
            const c = cam.current
            if (e.key === "ArrowRight") (c.vx = -14), e.preventDefault()
            if (e.key === "ArrowLeft") (c.vx = 14), e.preventDefault()
            if (e.key === "ArrowUp") stepDepth(-1), e.preventDefault()
            if (e.key === "ArrowDown") stepDepth(1), e.preventDefault()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    })

    /* ------------------------------------------------------- open / close */
    const openLook = (lookIndex: number, r: number, k: number, el: HTMLElement | null) => {
        if (pointer.current.moved > 6 || !settled()) return
        const root = rootRef.current
        let from: DOMRect | null = null
        if (el && root) {
            const rc = el.getBoundingClientRect(),
                rr = root.getBoundingClientRect()
            from = new DOMRect(rc.left - rr.left, rc.top - rr.top, rc.width, rc.height)
        }
        setHover(null)
        setClosing(false)
        setOpen({ look: lookIndex, orig: lookIndex, from, slotK: k, slotR: r })
        if (mobile && typeof history !== "undefined") {
            try {
                history.pushState({ ombrineSheet: 1 }, "")
            } catch (e) {}
        }
    }
    const close = () => {
        if (!openRef.current) return
        setClosing(true)
        window.setTimeout(
            () => {
                setOpen(null)
                setClosing(false)
            },
            reduced ? 600 : 1000
        )
    }
    const step = (dir: number) => {
        const o = openRef.current
        if (!o) return
        setOpen({ ...o, look: mod(o.look + dir, looks.length) })
    }
    useEffect(() => {
        if (isStatic || !mobile) return
        const onPop = () => {
            if (openRef.current) close()
        }
        window.addEventListener("popstate", onPop)
        return () => window.removeEventListener("popstate", onPop)
    })

    /* ----------------------------------------------------------- minimap */
    const onMinimap = (e: React.MouseEvent) => {
        e.stopPropagation()
        const rc = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const frac = (e.clientX - rc.left) / rc.width
        const c = cam.current
        const mid = geo[MID_ROW]
        const period = mid.spacing * u * looks.length
        const target = Math.floor(c.x / period) * period + frac * period
        const fromX = c.x
        const t0 = performance.now()
        const run = (now: number) => {
            const t = clamp((now - t0) / 400, 0, 1)
            c.x = fromX + (target - fromX) * (1 - Math.pow(1 - t, 3))
            if (t < 1) requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
        anyInput()
    }

    /* ----------------------------------------------------------- render */
    const renderRow = (g: PlaneGeo, r: number) => {
        const c = cam.current
        const restRel = relAt(r, restD)
        const isFocus = Math.abs(restRel) < 0.01
        const isFront = Math.abs(restRel + 1) < 0.01
        const interactive = (isFocus || isFront) && !isStatic
        const n = pool
        const b = bases[r]
        const h = refH
        const lk = rowLook(r, c.d)
        return (
            <div
                key={r}
                ref={(el) => {
                    rowWrapRefs.current[r] = el
                }}
                data-row={g.key}
                style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: lk.zIndex, opacity: lk.opacity, filter: lk.filter, visibility: lk.visibility }}
            >
                {Array.from({ length: n }, (_, j) => {
                    const i = b + j
                    const li = lookAt(r, i)
                    const look = looks[li]
                    if (!look) return null
                    const src = srcOf(look.image)
                    const aspect = look.aspect || 0.36
                    const w = h * aspect
                    const isHover = hover && hover.r === r && hover.k === j
                    const hidden = open && open.slotR === r && open.slotK === j && !closing ? 0 : 1
                    const devKey = `${r}:${j}`
                    return (
                        <div
                            key={j}
                            ref={(el) => {
                                rowRefs.current[r][j] = el
                            }}
                            style={{ position: "absolute", left: 0, top: 0, width: w, height: h, willChange: "transform", pointerEvents: "none", transformOrigin: "0 0", transform: slotPos(r, i, c.d, pan.current[r], c.y) }}
                        >
                            <div
                                ref={(el) => {
                                    leanRefs.current[r][j] = el
                                }}
                                style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%", opacity: hidden, transition: "opacity .3s" }}
                            >
                                <div
                                    ref={(el) => {
                                        devRefs.current[devKey] = el
                                    }}
                                    style={{ position: "absolute", inset: 0 }}
                                >
                                    <div
                                        role={interactive ? "button" : undefined}
                                        tabIndex={interactive && isFocus ? 0 : -1}
                                        aria-label={interactive ? `${look.title}, ${labels.look} ${String(li + 1).padStart(2, "0")}` : undefined}
                                        aria-hidden={interactive ? undefined : true}
                                        onPointerEnter={interactive && isFocus && !mobile ? () => settled() && setHover({ r, k: j, look: li }) : undefined}
                                        onPointerLeave={interactive && isFocus ? () => setHover((hv) => (hv && hv.r === r && hv.k === j ? null : hv)) : undefined}
                                        onClick={interactive ? (e) => openLook(li, r, isFocus ? j : -1, e.currentTarget as HTMLElement) : undefined}
                                        onFocus={interactive && isFocus ? () => setFocusK(j) : undefined}
                                        onBlur={interactive && isFocus ? () => setFocusK((f) => (f === j ? null : f)) : undefined}
                                        onKeyDown={interactive ? (e) => e.key === "Enter" && openLook(li, r, j, e.currentTarget as HTMLElement) : undefined}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: interactive ? "auto" : "none",
                                            cursor: interactive ? (cursorView && !mobile ? "none" : "pointer") : undefined,
                                            outline: "none",
                                            transformOrigin: "50% 100%",
                                            transform: isHover ? "scale(1.07)" : "scale(1)",
                                            transition: `transform ${isHover ? 0.5 : 0.6}s cubic-bezier(.22,1,.36,1)`,
                                        }}
                                    >
                                        <div
                                            aria-hidden
                                            style={{
                                                position: "absolute",
                                                left: "50%",
                                                bottom: -h * 0.022,
                                                width: w * 0.78 * (isHover ? 1.12 : 1),
                                                height: Math.max(4, h * 0.045),
                                                transform: "translateX(-50%)",
                                                borderRadius: "50%",
                                                background: `radial-gradient(closest-side, ${T.shadow}, transparent)`,
                                                opacity: isHover ? 1.3 : 1,
                                                transition: "width .5s cubic-bezier(.22,1,.36,1), opacity .5s",
                                                filter: "blur(2px)",
                                            }}
                                        />
                                        <img
                                            src={sized(src, 1024)}
                                            alt={isFocus ? look.title : ""}
                                            draggable={false}
                                            loading={isFocus || isFront ? "eager" : "lazy"}
                                            onLoad={!ASPECTS[src] && !measured[src] ? (e) => { const im = e.currentTarget; if (im.naturalHeight) { const a = im.naturalWidth / im.naturalHeight; setMeasured((m) => ({ ...m, [src]: a })) } } : undefined}
                                            decoding="async"
                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", userSelect: "none", WebkitUserDrag: "none" } as any}
                                        />
                                        {focusK === j && isFocus && (
                                            <div aria-hidden style={{ position: "absolute", left: "50%", bottom: -h * 0.04, width: w * 0.9, height: h * 0.07, transform: "translateX(-50%)", borderRadius: "50%", border: `1px solid ${T.ink}` }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const wg = mobile ? WORDMARK_GEO.mobile : WORDMARK_GEO.desktop
    const wordW = wg.w * u
    const wordH = wordW * WORDMARK_RATIO
    const showWallWord = showIntro && !reduced && !isStatic && !wordGone
    const logo = mobile ? LOGO.mobile : LOGO.desktop
    const introHidden = showIntro && !reduced && !isStatic && !introDone
    const scrollHint = !labels.zoomHint || OLD_ZOOM_HINTS.includes(labels.zoomHint) ? SCROLL_HINT[lang] || SCROLL_HINT.en : labels.zoomHint

    const hoveredLook = hover ? looks[hover.look] : null
    const lookPrice = (l: Look) => l.pieces.reduce((n, p) => n + (Number(p.price) || 0), 0)

    return (
        <div
            ref={rootRef}
            data-salon-version="5"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                isolation: "isolate",
                background: T.ground,
                touchAction: "none",
                userSelect: "none",
                cursor: open ? "default" : pointer.current.down ? "grabbing" : "grab",
                fontFamily: ff.sans(),
                color: T.ink,
            }}
        >
            {fontLink(lang)}
            {/* studio light and a faint warm stage glow (visible in Nuit) */}
            <div ref={groundRef} aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 75% at 50% 50%, ${T.tileLight} 0%, ${T.ground} 55%, ${T.groundDeep} 100%)` }} />
            <div aria-hidden style={{ position: "absolute", left: "15%", right: "15%", top: "38%", height: "45%", background: `radial-gradient(closest-side, ${STAGE_GLOW}, transparent)`, pointerEvents: "none" }} />

            {/* the world: four rows in depth, and the opening wordmark between back and focus */}
            <div ref={worldRef} style={{ position: "absolute", inset: 0, transformOrigin: "0 0", willChange: "transform", transform: `translate3d(${cam.current.tx}px, ${cam.current.ty}px, 0) scale(${(1 + cam.current.breath) * cam.current.intro})` }}>
                {geo.map((g, r) => renderRow(g, r))}
                {showWallWord && (
                    <div
                        ref={wordRef}
                        aria-hidden
                        style={{ position: "absolute", left: 0, top: 0, width: wordW, height: wordH, zIndex: 25, pointerEvents: "none", transform: `translate3d(${size.w / 2 + (wg.cx - wg.w / 2 - base.w / 2) * u - cam.current.x * (reduced ? 1 : 0.8)}px, ${(size.h - base.h * u) / 2 + wg.y * u - cam.current.y * (reduced ? 1 : 0.8)}px, 0)` }}
                    >
                        <Wordmark custom={wordmark} letterRefs={letterRefs} />
                    </div>
                )}
            </div>

            {/* fog toward the far plane and over the floor */}
            <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${(150 / 900) * 100}%`, background: `linear-gradient(${T.ground}, transparent)`, opacity: 0.9, pointerEvents: "none", zIndex: 5 }} />
            <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(180 / 900) * 100}%`, background: `linear-gradient(transparent, ${T.ground} 70%)`, opacity: 0.94, pointerEvents: "none", zIndex: 5 }} />

            {/* the wordmark, landed small at the header centre */}
            <div
                ref={smallRef}
                aria-hidden
                style={{ position: "absolute", left: size.w / 2 - logo.w / 2, top: logo.top, width: logo.w, height: logo.w * WORDMARK_RATIO, zIndex: 9, pointerEvents: "none", opacity: open ? 0 : 1 }}
            >
                <Wordmark custom={wordmark} letterRefs={smallLetterRefs} hidden={introHidden} />
            </div>

            {/* hover caption */}
            {!mobile && (
                <div ref={captionRef} aria-hidden style={{ position: "absolute", left: 0, top: 0, zIndex: 6, pointerEvents: "none", textAlign: "center", whiteSpace: "nowrap" }}>
                    <div style={{ opacity: hoveredLook && !open ? 1 : 0, transform: `translateY(${hoveredLook && !open ? 0 : 6}px)`, transition: "opacity .45s .08s, transform .45s .08s cubic-bezier(.22,1,.36,1)" }}>
                        <div style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 18, lineHeight: 1.4 }}>{hoveredLook?.title}</div>
                        <div style={{ fontSize: 12, letterSpacing: "0.006em", color: T.inkSoft, marginTop: 4 }}>
                            {labels.look} {hover ? String(hover.look + 1).padStart(2, "0") : ""} · {hoveredLook ? formatPrice(lookPrice(hoveredLook), lang) : ""}
                        </div>
                    </div>
                </div>
            )}

            {/* chrome over the wall */}
            <div
                ref={chromeRef}
                style={{
                    position: "absolute",
                    left: mobile ? 20 : 40,
                    right: mobile ? 20 : 40,
                    bottom: mobile ? 26 : 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    zIndex: 9,
                    pointerEvents: "none",
                }}
            >
                <div style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: mobile ? 16 : 18, lineHeight: 1.4, width: mobile ? "auto" : 360, whiteSpace: "nowrap" }}>
                    {seasonLink && !isStatic ? (
                        <a
                            href={seasonLink}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => goTo(seasonLink, e)}
                            style={{ color: "inherit", textDecoration: "none", borderBottom: `1px solid ${T.outline}`, paddingBottom: 2, pointerEvents: open ? "none" : "auto", cursor: "pointer" }}
                        >
                            {season}
                        </a>
                    ) : (
                        season
                    )}
                </div>
                {!mobile && (
                    <div style={{ fontSize: 12, letterSpacing: "0.006em", color: T.inkSoft, whiteSpace: "pre", opacity: open ? 0 : 1, transition: "opacity .4s" }}>
                        {labels.dragHint}
                        {"  ·  "}
                        {labels.clickHint}
                    </div>
                )}
                {mobile ? (
                    <div style={{ fontSize: 12, color: T.inkSoft, opacity: open ? 0 : 1 }}>{labels.dragHint}</div>
                ) : (
                    <div style={{ width: 360, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, opacity: open ? 0 : 1, transition: "opacity .4s" }}>
                        <span style={{ fontSize: 12, letterSpacing: "0.006em", color: T.inkSoft }}>{scrollHint}</span>
                        {showMinimap && (
                            <button
                                aria-label="Minimap"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={onMinimap}
                                style={{ position: "relative", width: 84, height: 28, border: `1px solid ${T.outline}`, background: "transparent", padding: 0, cursor: "pointer", pointerEvents: open ? "none" : "auto", overflow: "hidden" }}
                            >
                                <div
                                    ref={viewRectRef}
                                    style={{ position: "absolute", left: 0, top: 6, width: 26, height: 14, border: `1px solid ${T.ink}`, background: T.hairline, transition: "transform .4s cubic-bezier(.22,1,.36,1)" }}
                                />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* custom cursor: an 8 px dot that becomes the 76 px View disc */}
            {cursorView && !mobile && !isStatic && <Cursor refEl={cursorRef} active={!!hover && !open} visible={!open} label={labels.view} />}

            {/* the look, opened */}
            <AnimatePresence>
                {open && !isStatic && (
                    <OpenLook
                        key="open"
                        looks={looks}
                        state={open}
                        closing={closing}
                        size={size}
                        mobile={mobile}
                        u={u}
                        labels={labels}
                        lang={lang}
                        reduced={reduced}
                        speed={speed}
                        wordmark={wordmark}
                        wordFrom={null}
                        rootEl={rootRef.current}
                        onClose={close}
                        onStep={step}
                        onPick={(i: number) => setOpen((o) => (o ? { ...o, look: i } : o))}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

const STAGE_GLOW = "var(--token-8d544951-3dfe-4ad0-a3cf-acbc21e0c306, rgba(255,250,240,0))"

/* --------------------------------------------------------------- wordmark */
const LETTER_CENTRES = [90, 262, 428, 560, 648, 742, 878]
function Wordmark({ custom, letterRefs, color, hidden }: { custom?: string; letterRefs?: React.MutableRefObject<(SVGSVGElement | null)[]>; color?: string; hidden?: boolean }) {
    if (custom) return <img src={custom} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: hidden ? 0 : undefined }} />
    const letters = Array.from("MR. FICTION")
    return (
        <svg viewBox="0 0 1200 240" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", opacity: hidden ? 0 : undefined }} aria-hidden="true">
            <text x="600" y="166" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="146" fontWeight="800" letterSpacing="1.5" fill={color || T.ink}>
                {letters.map((letter, i) => (
                    <motion.tspan key={i} initial={{ opacity: 0 }} animate={{ opacity: hidden ? 0 : 1 }} transition={{ duration: 0.34, delay: i * 0.075, ease: [0.22, 1, 0.36, 1] }}>
                        {letter === " " ? "\u00a0" : letter}
                    </motion.tspan>
                ))}
            </text>
        </svg>
    )
}

/* ----------------------------------------------------------------- cursor */
function Cursor({ refEl, active, visible, label }: { refEl: React.RefObject<HTMLDivElement>; active: boolean; visible: boolean; label: string }) {
    const sz = useSpring(8, { stiffness: 260, damping: 26 })
    useEffect(() => {
        sz.set(active ? 76 : 8)
    }, [active])
    return (
        <div ref={refEl} aria-hidden style={{ position: "absolute", left: 0, top: 0, zIndex: 20, pointerEvents: "none", transform: "translate3d(-100px,-100px,0)" }}>
            <motion.div
                style={{
                    width: sz,
                    height: sz,
                    x: "-50%",
                    y: "-50%",
                    borderRadius: "50%",
                    background: T.ink,
                    color: T.onInk,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    letterSpacing: "0.006em",
                    opacity: visible ? 1 : 0,
                    overflow: "hidden",
                }}
            >
                <span style={{ opacity: active ? 1 : 0, transition: "opacity .25s" }}>{label}</span>
            </motion.div>
        </div>
    )
}

/* --------------------------------------------------------------- OpenLook */
interface OpenLookProps {
    looks: Look[]
    state: { look: number; orig: number; from: DOMRect | null; slotK: number }
    closing: boolean
    size: { w: number; h: number }
    mobile: boolean
    u: number
    labels: Labels
    lang: string
    reduced: boolean
    speed: number
    wordmark?: string
    wordFrom: HTMLDivElement | null
    rootEl: HTMLDivElement | null
    onClose: () => void
    onStep: (d: number) => void
    onPick: (i: number) => void
}

const rememberedSizes: Record<string, string> = {}

function OpenLook(p: OpenLookProps) {
    const { looks, state, closing, size, mobile, u, labels, lang, reduced, speed } = p
    const look = looks[state.look]
    const navigate = useNavigate()
    const d = (s: number) => s / speed
    const [piece, setPiece] = useState(0)
    const [sizes, setSizes] = useState<Record<string, string>>(() => ({ ...rememberedSizes }))
    const [added, setAdded] = useState<string | null>(null)
    const [fullAdded, setFullAdded] = useState(false)
    const [pulse, setPulse] = useState(0)
    const [ask, setAsk] = useState<string | null>(null)
    const [notify, setNotify] = useState<string | null>(null)
    const [guide, setGuide] = useState(false)
    const [dir, setDir] = useState(1)
    const prevLook = useRef(state.look)
    const items = useBag()

    useEffect(() => {
        if (prevLook.current !== state.look) {
            setDir(state.look > prevLook.current || (prevLook.current === looks.length - 1 && state.look === 0) ? 1 : -1)
            prevLook.current = state.look
            setPiece(0)
            setAdded(null)
            setFullAdded(false)
            setAsk(null)
            setNotify(null)
            setGuide(false)
        }
    }, [state.look])

    const pc = look.pieces[piece] || look.pieces[0]
    const type = sizeType(pc)
    const list = splitList(pc.sizes)
    const sold = splitList(pc.soldOut)
    // the first piece shown gets a sensible default size, like the design
    useEffect(() => {
        if (!sizes[type] && list.length) {
            const avail = list.filter((s) => !sold.includes(s))
            const def = avail[Math.floor((avail.length - 1) / 2)] || avail[0]
            if (def && piece === 0 && Object.keys(sizes).length === 0) {
                rememberedSizes[type] = def
                setSizes((s) => ({ ...s, [type]: def }))
            }
        }
    }, [type])
    const chosen = sizes[type]
    const pickSize = (s: string) => {
        if (sold.includes(s)) {
            setNotify(s)
            return
        }
        setNotify(null)
        setAsk(null)
        rememberedSizes[type] = s
        setSizes((x) => ({ ...x, [type]: s }))
        setAdded(null)
    }
    const total = look.pieces.reduce((n, x) => n + (Number(x.price) || 0), 0)
    const inBag = (x: Piece) => items.some((i) => i.slug === slugOf(x))

    const addOne = () => {
        if (!chosen && list.length) {
            setAsk(pc.name)
            setPulse((n) => n + 1)
            return
        }
        bag.add({ slug: slugOf(pc), name: pc.name, colour: pc.material, size: chosen || "One size", price: Number(pc.price) || 0, image: srcOf(pc.image) })
        setAdded(`${piece}:${chosen}`)
    }
    const addAll = () => {
        for (let i = 0; i < look.pieces.length; i++) {
            const x = look.pieces[i]
            const t = sizeType(x)
            if (splitList(x.sizes).length && !sizes[t]) {
                setPiece(i)
                setAsk(x.name)
                setPulse((n) => n + 1)
                return
            }
        }
        look.pieces.forEach((x) => bag.add({ slug: slugOf(x), name: x.name, colour: x.material, size: sizes[sizeType(x)] || "One size", price: Number(x.price) || 0, image: srcOf(x.image) }))
        setFullAdded(true)
    }
    const isAdded = added === `${piece}:${chosen}`

    // geometry
    const W = size.w,
        H = size.h
    const stageH = mobile ? 373 * u : Math.min(740 * u, H - 120)
    const aspect = look.aspect || 0.4
    const stageW = stageH * aspect
    const stageLeft = mobile ? W / 2 - stageW / 2 : W * (590 / 1440) - stageW / 2
    const stageTop = mobile ? 74 * u : Math.max(92, 118 * u)
    const from = state.from
    const flyFrom =
        from && !reduced
            ? { x: from.x - stageLeft, y: from.y - stageTop, scale: from.height / stageH, opacity: 1 }
            : { x: reduced ? 0 : 40 * dir, y: 0, scale: 1, opacity: 0 }

    // wordmark flight: wall → header centre (two halves)
    const logo = mobile ? LOGO.mobile : LOGO.desktop
    const logoW = logo.w
    const logoH = logoW * WORDMARK_RATIO
    const logoLeft = W / 2 - logoW / 2
    let wf = { x: 0, y: 0, s: 1 }
    if (p.wordFrom && p.rootEl) {
        const r = p.wordFrom.getBoundingClientRect(),
            rr = p.rootEl.getBoundingClientRect()
        wf = { x: r.left - rr.left - logoLeft, y: r.top - rr.top - logo.top, s: r.width / logoW }
    }
    const midW = mobile ? 200 : 500
    const mid = { x: W / 2 - midW / 2 - logoLeft, y: (mobile ? 60 : 92) - logo.top, s: midW / logoW }
    const tw = d(1.2)
    // without a wall wordmark the logo is already in place at the header centre
    const flight = !!p.wordFrom

    const veilT: any = { duration: closing ? d(0.8) : d(0.9), ease: [0.45, 0, 0.55, 1] }
    const panelIn: any = { duration: d(0.9), delay: closing ? 0 : d(0.55), ease: [0.22, 1, 0.36, 1] }

    const titleWords = look.title.split(" ")

    return (
        <motion.div
            style={{ position: "absolute", inset: 0, zIndex: 10 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 1, transition: { duration: d(0.8) } }}
        >
            {/* veil */}
            <motion.div
                onClick={p.onClose}
                initial={{ backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)", opacity: 0 } as any}
                animate={
                    closing
                        ? ({ backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)", opacity: 0 } as any)
                        : ({ backdropFilter: `blur(${mobile ? 18 : 22}px)`, WebkitBackdropFilter: `blur(${mobile ? 18 : 22}px)`, opacity: 1 } as any)
                }
                transition={veilT}
                style={{ position: "absolute", inset: 0, background: `color-mix(in srgb, ${T.ground} 55%, transparent)`, cursor: "default" }}
            />

            {/* wordmark → logo */}
            <motion.div
                aria-hidden
                initial={!flight ? { opacity: 1, x: 0, y: 0, scale: 1 } : reduced ? { opacity: 0, x: 0, y: 0, scale: 1 } : { x: wf.x, y: wf.y, scale: wf.s, filter: "blur(0px)" }}
                animate={
                    !flight
                        ? { opacity: 1, x: 0, y: 0, scale: 1 }
                        : closing
                        ? reduced
                            ? { opacity: 0, transition: { duration: 0.6 } }
                            : { x: wf.x, y: wf.y, scale: wf.s, filter: "blur(0px)", transition: { duration: d(1.0), ease: [0.45, 0, 0.55, 1] } }
                        : reduced
                          ? { opacity: 1, transition: { duration: 0.6 } }
                          : {
                                x: [wf.x, mid.x, 0],
                                y: [wf.y, mid.y, 0],
                                scale: [wf.s, mid.s, 1],
                                filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
                                transition: { duration: tw, delay: d(0.1), times: [0, 0.375, 1], ease: [[0.55, 0, 0.75, 0.35], [0.22, 1, 0.36, 1]] as any },
                            }
                }
                style={{ position: "absolute", left: logoLeft, top: logo.top, width: logoW, height: logoH, transformOrigin: "0 0", zIndex: 30, pointerEvents: "none" }}
            >
                <Wordmark custom={p.wordmark} />
            </motion.div>

            {/* the look on the stage */}
            <AnimatePresence initial={true} mode="popLayout" custom={dir}>
                <motion.div
                    key={state.look}
                    custom={dir}
                    initial={prevLook.current === state.look && from ? flyFrom : { x: 40 * dir, opacity: 0, y: 0, scale: 1 }}
                    animate={
                        closing
                            ? from && state.look === state.orig && !reduced
                                ? { ...flyFrom, transition: { duration: d(0.8), ease: [0.65, 0, 0.35, 1] } }
                                : { opacity: 0, transition: { duration: d(0.5) } }
                            : { x: 0, y: 0, scale: 1, opacity: 1, transition: { duration: from && prevLook.current === state.look ? d(1.1) : d(0.7), ease: [0.65, 0, 0.35, 1] } }
                    }
                    exit={{ x: -40, opacity: 0, transition: { duration: d(0.5), ease: [0.22, 1, 0.36, 1] } }}
                    style={{ position: "absolute", left: stageLeft, top: stageTop, width: stageW, height: stageH, transformOrigin: "0 0", zIndex: 12, pointerEvents: "none" }}
                >
                    <div style={{ position: "absolute", left: "50%", bottom: -stageH * 0.02, width: stageW * 0.8, height: stageH * 0.045, transform: "translateX(-50%)", borderRadius: "50%", background: `radial-gradient(closest-side, ${T.shadow}, transparent)`, filter: "blur(3px)" }} />
                    <img src={sized(srcOf(look.image), 1024)} alt={look.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
                </motion.div>
            </AnimatePresence>

            {!mobile ? (
                <>
                    {/* title and description */}
                    <div style={{ position: "absolute", left: 80, top: Math.max(130, 150 * u), width: 300, zIndex: 13 }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={state.look} exit={{ opacity: 0, transition: { duration: d(0.4) } }}>
                                <h2 style={{ margin: 0, fontFamily: ff.serif(), fontWeight: ff.light(), fontStyle: ff.italic(), fontSize: 62, lineHeight: 1.1, letterSpacing: "-0.005em", whiteSpace: "nowrap" }}>
                                    {titleWords.map((w, i) => (
                                        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em", marginRight: "0.22em" }}>
                                            <motion.span
                                                style={{ display: "inline-block" }}
                                                initial={{ y: "100%" }}
                                                animate={{ y: closing ? "100%" : "0%" }}
                                                transition={{ duration: d(0.9), delay: closing ? 0 : d(0.45 + i * 0.08), ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                {w}
                                            </motion.span>
                                        </span>
                                    ))}
                                </h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: closing ? 0 : 1 }}
                                    transition={{ duration: d(0.7), delay: closing ? 0 : d(0.6) }}
                                    style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.5, color: T.inkSoft, maxWidth: 300 }}
                                >
                                    {look.intro}
                                </motion.p>
                                {look.slug && (
                                    <motion.a
                                        href={`/looks/${look.slug}`}
                                        onClick={(e: any) => navigate(`/looks/${look.slug}`, e)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: closing ? 0 : 1 }}
                                        transition={{ duration: d(0.7), delay: closing ? 0 : d(0.7) }}
                                        style={{ display: "inline-flex", gap: 8, marginTop: 18, fontSize: 13, color: T.ink, textDecoration: "none", borderBottom: `1px solid ${T.outline}`, paddingBottom: 3 }}
                                    >
                                        {labels.viewLookPage} <span aria-hidden>→</span>
                                    </motion.a>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* stepper */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: closing ? 0 : 1 }}
                        transition={{ duration: d(0.6), delay: closing ? 0 : d(0.7) }}
                        style={{ position: "absolute", left: 80, bottom: 76, display: "flex", alignItems: "center", gap: 32, zIndex: 13, fontSize: 12, color: T.inkSoft }}
                    >
                        <button onClick={() => p.onStep(-1)} style={stepBtn} aria-label="Previous look">
                            <span style={{ color: T.ink, fontSize: 14 }}>←</span>
                            <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 18, color: T.ink }}>{looks[mod(state.look - 1, looks.length)].title}</span>
                            <span>{String(mod(state.look - 1, looks.length) + 1).padStart(2, "0")}</span>
                        </button>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            {String(state.look + 1).padStart(2, "0")} / {String(looks.length).padStart(2, "0")}
                        </span>
                        <button onClick={() => p.onStep(1)} style={stepBtn} aria-label="Next look">
                            <span>{String(mod(state.look + 1, looks.length) + 1).padStart(2, "0")}</span>
                            <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 18, color: T.ink }}>{looks[mod(state.look + 1, looks.length)].title}</span>
                            <span style={{ color: T.ink, fontSize: 14 }}>→</span>
                        </button>
                    </motion.div>

                    {/* the glass panel */}
                    <motion.div
                        role="dialog"
                        aria-label={look.title}
                        initial={{ x: 40, opacity: 0 }}
                        animate={closing ? { x: 40, opacity: 0, transition: { duration: d(0.6) } } : { x: 0, opacity: 1 }}
                        transition={panelIn}
                        onPointerDown={(e) => e.stopPropagation()}
                        data-salon-panel=""
                        style={{
                            position: "absolute",
                            right: Math.max(40, W * (64 / 1440)),
                            top: 92,
                            width: 460,
                            maxHeight: H - 120,
                            overflowY: "auto",
                            zIndex: 14,
                            boxSizing: "border-box",
                            padding: "22px 28px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            background: T.glass,
                            backdropFilter: "blur(15px)",
                            WebkitBackdropFilter: "blur(15px)",
                            border: `1px solid color-mix(in srgb, ${T.surface} 70%, transparent)`,
                            borderRadius: 4,
                            boxShadow: "0 30px 40px rgba(22,19,15,0.14)",
                        }}
                    >
                        <style>{"[data-salon-panel] > * { flex-shrink: 0 } [data-salon-panel] { scrollbar-width: none }"}</style>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={state.look}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: d(0.4) }}
                                style={{ display: "flex", flexDirection: "column", gap: 16 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 18, lineHeight: 1.4 }}>{labels.threePieces}</span>
                                    <button onClick={p.onClose} style={{ ...plainBtn, display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                                        {labels.close} <span aria-hidden>×</span>
                                    </button>
                                </div>
                                <div style={{ position: "relative", height: clamp(H - 648, 96, 228), borderRadius: 2, background: studioTile, overflow: "hidden" }}>
                                    <AnimatePresence initial={false}>
                                        <motion.img
                                            key={`${state.look}:${piece}`}
                                            src={sized(srcOf(pc.image), 1024)}
                                            alt={pc.name}
                                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: d(0.55), ease: [0.22, 1, 0.36, 1] }}
                                            style={{ position: "absolute", left: 0, right: 0, top: 14, bottom: 14, margin: "auto", height: clamp(H - 648, 96, 228) - 28, width: "100%", objectFit: "contain" }}
                                        />
                                    </AnimatePresence>
                                </div>
                                <div>
                                    {look.pieces.map((x, i) => (
                                        <motion.button
                                            key={i}
                                            onClick={() => {
                                                setPiece(i)
                                                setNotify(null)
                                                setAsk(null)
                                            }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: i === piece ? 1 : 0.6, y: 0 }}
                                            transition={{ duration: d(0.4), delay: d(0.6 + i * 0.06) }}
                                            style={{ ...plainBtn, width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "9px 0", borderTop: `1px solid ${T.hairline}`, textAlign: "left" }}
                                        >
                                            <span style={{ width: 48, height: 48, flex: "0 0 48px", borderRadius: 2, background: studioTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <img src={sized(srcOf(x.image), 256)} alt="" style={{ maxWidth: 40, maxHeight: 40, objectFit: "contain" }} />
                                            </span>
                                            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                                <span style={{ fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: 19, lineHeight: 1.2 }}>{x.name}</span>
                                                <span style={{ fontSize: 12, lineHeight: 1.45, color: T.inkSoft }}>{x.material}</span>
                                            </span>
                                            <span style={{ fontSize: 14, whiteSpace: "nowrap", color: inBag(x) ? T.oxblood : T.ink, fontVariantNumeric: "tabular-nums" }}>
                                                {inBag(x) ? labels.inYourBag : formatPrice(Number(x.price), lang)}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                        <SizeRow list={list} sold={sold} chosen={chosen} onPick={pickSize} pulse={pulse} keyId={`${state.look}:${piece}`} d={d} right={<button onClick={() => setGuide(true)} style={{ ...plainBtn, fontSize: 12, color: T.inkSoft, textDecoration: "underline" }}>{labels.sizeGuide}</button>} />
                        {(ask || notify) && (
                            <div style={{ fontSize: 12, color: ask ? T.oxblood : T.inkSoft, marginTop: -6 }}>
                                {ask ? `${labels.chooseSize} — ${ask}` : <NotifyLine size={notify!} labels={labels} />}
                            </div>
                        )}
                        <AddButton added={isAdded} price={formatPrice(Number(pc.price), lang)} labels={labels} onAdd={addOne} onView={openBag} d={d} />
                        <button onClick={fullAdded ? openBag : addAll} style={{ ...plainBtn, height: 48, border: `1px solid ${fullAdded ? T.oxblood : T.outline}`, color: fullAdded ? T.oxblood : T.ink, borderRadius: 2, padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 500, fontSize: 14, letterSpacing: "0.004em" }}>
                            <span>{fullAdded ? labels.fullLookAdded : labels.addFullLook}</span>
                            <span style={{ fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>{fullAdded ? labels.viewBag : formatPrice(total, lang)}</span>
                        </button>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: T.inkSoft }}>{labels.delivery}</p>
                        <AnimatePresence>{guide && <SizeGuide labels={labels} onClose={() => setGuide(false)} />}</AnimatePresence>
                    </motion.div>
                </>
            ) : (
                <MobileSheet
                    look={look}
                    index={state.look}
                    count={looks.length}
                    piece={piece}
                    setPiece={(i: number) => {
                        setPiece(i)
                        setAsk(null)
                        setNotify(null)
                    }}
                    closing={closing}
                    d={d}
                    labels={labels}
                    lang={lang}
                    list={list}
                    sold={sold}
                    chosen={chosen}
                    pickSize={pickSize}
                    pulse={pulse}
                    isAdded={isAdded}
                    fullAdded={fullAdded}
                    ask={ask}
                    notify={notify}
                    onAdd={addOne}
                    onAddAll={addAll}
                    onClose={() => {
                        try {
                            if (history.state && history.state.ombrineSheet) history.back()
                            else p.onClose()
                        } catch (e) {
                            p.onClose()
                        }
                    }}
                    total={total}
                />
            )}
        </motion.div>
    )
}

const plainBtn: React.CSSProperties = { appearance: "none", background: "none", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", cursor: "pointer" }
const stepBtn: React.CSSProperties = { ...plainBtn, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "inherit" }

function NotifyLine({ size, labels }: { size: string; labels: Labels }) {
    const [done, setDone] = useState(false)
    return done ? (
        <span>{labels.notifyThanks}</span>
    ) : (
        <span>
            {size} — {labels.soldOut}.{" "}
            <button onClick={() => setDone(true)} style={{ ...plainBtn, textDecoration: "underline", color: T.ink }}>
                {labels.notifyMe}
            </button>
        </span>
    )
}

function SizeRow({ list, sold, chosen, onPick, pulse, keyId, d, right, big }: { list: string[]; sold: string[]; chosen?: string; onPick: (s: string) => void; pulse: number; keyId: string; d: (n: number) => number; right?: React.ReactNode; big?: boolean }) {
    return (
        <motion.div
            key={`pulse-${pulse}`}
            animate={pulse ? { x: [0, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
        >
            <div role="radiogroup" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {list.map((s, i) => {
                        const isSold = sold.includes(s)
                        const on = chosen === s
                        return (
                            <motion.button
                                key={keyId + s}
                                role="radio"
                                aria-checked={on}
                                aria-label={isSold ? `${s}, sold out` : s}
                                onClick={() => onPick(s)}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: d(0.3), delay: d(0.1 + i * 0.03) }}
                                style={{
                                    ...plainBtn,
                                    minWidth: big ? 60 : 44,
                                    height: big ? 44 : 36,
                                    padding: "0 8px",
                                    border: `1px solid ${on ? T.ink : T.hairline}`,
                                    borderColor: on ? T.ink : T.outline,
                                    opacity: 1,
                                    borderRadius: 2,
                                    fontSize: 13,
                                    color: isSold ? T.inkSoft : T.ink,
                                    textDecoration: isSold ? "line-through" : "none",
                                    boxSizing: "border-box",
                                }}
                            >
                                {s}
                            </motion.button>
                        )
                    })}
                </AnimatePresence>
            </div>
            {right}
        </motion.div>
    )
}

function Odometer({ value }: { value: string }) {
    return (
        <span style={{ position: "relative", display: "inline-block", overflow: "hidden", height: "1.2em", lineHeight: "1.2em", verticalAlign: "middle", fontVariantNumeric: "tabular-nums" }}>
            <AnimatePresence initial={false} mode="popLayout">
                <motion.span key={value} initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ display: "inline-block" }}>
                    {value}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

function AddButton({ added, price, labels, onAdd, onView, d, tall }: { added: boolean; price: string; labels: Labels; onAdd: () => void; onView: () => void; d: (n: number) => number; tall?: boolean }) {
    return (
        <button
            onClick={added ? onView : onAdd}
            style={{ ...plainBtn, position: "relative", height: 52, borderRadius: 2, background: T.ink, color: T.onInk, overflow: "hidden", fontSize: 14, fontWeight: 500, letterSpacing: "0.004em", width: "100%" }}
        >
            <motion.span
                aria-hidden
                initial={false}
                animate={{ scaleX: added ? 1 : 0 }}
                transition={{ duration: d(0.6), ease: [0.45, 0, 0.55, 1] }}
                style={{ position: "absolute", inset: 0, background: T.oxblood, transformOrigin: "0 50%" }}
            />
            <span style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 22px", height: "100%" }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={added ? "a" : "b"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: added ? d(0.15) : 0 }} style={{ color: added ? "#EEE7DC" : T.onInk }}>
                        {added ? `${labels.added} ✓` : labels.addToBag}
                    </motion.span>
                </AnimatePresence>
                <span style={{ fontWeight: 400, color: added ? "#EEE7DC" : T.onInk }}>{added ? labels.viewBag : <Odometer value={price} />}</span>
            </span>
        </button>
    )
}

function SizeGuide({ labels, onClose }: { labels: Labels; onClose: () => void }) {
    const rows = [
        ["XS", "34", "44", "36"],
        ["S", "36", "46", "37"],
        ["M", "38", "48", "38–39"],
        ["L", "40", "50", "40"],
        ["XL", "42", "52", "41–42"],
        ["XXL", "44", "54", "43–44"],
    ]
    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.surface, padding: "22px 28px", borderTop: `1px solid ${T.hairline}`, zIndex: 3 }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontSize: 18 }}>{labels.sizeGuide}</span>
                <button onClick={onClose} style={{ ...plainBtn, fontSize: 14 }}>
                    {labels.close} ×
                </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr style={{ color: T.inkSoft, textAlign: "left" }}>
                        {["", "FR", "IT", "EU shoe"].map((h) => (
                            <th key={h} style={{ fontWeight: 400, padding: "6px 0", borderBottom: `1px solid ${T.hairline}` }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r[0]}>
                            {r.map((c, i) => (
                                <td key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.hairline}` }}>
                                    {c}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    )
}

/* ------------------------------------------------------------ MobileSheet */
function MobileSheet(p: {
    look: Look
    index: number
    count: number
    piece: number
    setPiece: (i: number) => void
    closing: boolean
    d: (n: number) => number
    labels: Labels
    lang: string
    list: string[]
    sold: string[]
    chosen?: string
    pickSize: (s: string) => void
    pulse: number
    isAdded: boolean
    fullAdded: boolean
    ask: string | null
    notify: string | null
    onAdd: () => void
    onAddAll: () => void
    onClose: () => void
    total: number
}) {
    const sheetNavigate = useNavigate()
    const { look, piece, labels, lang, d } = p
    const pc = look.pieces[piece]
    const ref = useRef<HTMLDivElement>(null)
    const st = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: d(0.5), delay: d(0.3 + i * 0.05) } })
    return (
        <motion.div
            ref={ref}
            role="dialog"
            aria-label={look.title}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onDragEnd={(e, info) => {
                const h = ref.current?.offsetHeight || 420
                if (info.velocity.y > 600 || info.offset.y > h * 0.3) p.onClose()
            }}
            initial={{ y: "100%" }}
            animate={{ y: p.closing ? "100%" : "0%" }}
            transition={{ duration: d(0.8), ease: [0.22, 1, 0.36, 1] }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 15,
                background: T.glass,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderTop: "1px solid rgba(255,255,255,0.6)",
                borderRadius: "16px 16px 0 0",
                padding: "11px 21px calc(18px + env(safe-area-inset-bottom))",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                touchAction: "none",
            }}
        >
            <div aria-hidden style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, background: T.outline, marginBottom: 4 }} />
            <motion.div {...st(0)} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: ff.serif(), fontStyle: ff.italic(), fontWeight: 300, fontSize: 34, lineHeight: 1.1 }}>{look.title}</span>
                <span style={{ fontSize: 12, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>
                    {String(p.index + 1).padStart(2, "0")} / {String(p.count).padStart(2, "0")}
                </span>
            </motion.div>
            {look.slug && (
                <a href={`/looks/${look.slug}`} onClick={(e) => sheetNavigate(`/looks/${look.slug}`, e)} style={{ alignSelf: "flex-start", fontSize: 13, color: T.ink, textDecoration: "none", borderBottom: `1px solid ${T.outline}`, paddingBottom: 3 }}>
                    {p.labels.viewLookPage} →
                </a>
            )}
            <motion.div {...st(1)} style={{ display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory" }}>
                {look.pieces.map((x, i) => (
                    <button
                        key={i}
                        onClick={() => p.setPiece(i)}
                        aria-label={x.name}
                        style={{ ...plainBtn, flex: "1 0 30%", height: 92, minWidth: 96, scrollSnapAlign: "start", background: studioTile, border: `1px solid ${i === piece ? T.ink : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <img src={sized(srcOf(x.image), 256)} alt="" style={{ maxHeight: 76, maxWidth: "80%", objectFit: "contain" }} />
                    </button>
                ))}
            </motion.div>
            <motion.div {...st(2)} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <div style={{ fontFamily: ff.serif(), fontWeight: ff.medium(), fontSize: 22, lineHeight: 1.2 }}>{pc.name}</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{pc.material}</div>
                </div>
                <div style={{ fontSize: 15, whiteSpace: "nowrap" }}>{formatPrice(Number(pc.price), lang)}</div>
            </motion.div>
            <motion.div {...st(3)}>
                <SizeRow big list={p.list} sold={p.sold} chosen={p.chosen} onPick={p.pickSize} pulse={p.pulse} keyId={`${p.index}:${piece}`} d={d} />
                {(p.ask || p.notify) && <div style={{ fontSize: 12, color: p.ask ? T.oxblood : T.inkSoft, marginTop: 8 }}>{p.ask ? `${labels.chooseSize} — ${p.ask}` : <NotifyLine size={p.notify!} labels={labels} />}</div>}
            </motion.div>
            <motion.div {...st(4)}>
                <AddButton added={p.isAdded} price={formatPrice(Number(pc.price), lang)} labels={labels} onAdd={p.onAdd} onView={openBag} d={d} />
            </motion.div>
            <motion.button {...st(5)} onClick={p.fullAdded ? openBag : p.onAddAll} style={{ ...plainBtn, display: "flex", justifyContent: "space-between", minHeight: 44, alignItems: "center", fontSize: 13 }}>
                <span style={{ textDecoration: "underline", color: p.fullAdded ? T.oxblood : T.ink }}>{p.fullAdded ? labels.fullLookAdded : labels.addFullLook}</span>
                <span style={{ color: T.inkSoft }}>{p.fullAdded ? labels.viewBag : formatPrice(p.total, lang)}</span>
            </motion.button>
        </motion.div>
    )
}

/* ------------------------------------------------------------- defaults */
const DEFAULT_LABELS: Labels = {
    threePieces: "Three pieces",
    viewLookPage: "View the look page",
    close: "Close",
    sizeGuide: "Size guide",
    addToBag: "Add to bag",
    added: "Added to bag",
    viewBag: "View bag",
    addFullLook: "Add the full look",
    fullLookAdded: "Look added",
    inYourBag: "In your bag",
    chooseSize: "Choose a size",
    soldOut: "sold out",
    notifyMe: "Notify me",
    notifyThanks: "We will write to you when it is back.",
    delivery: "Complimentary delivery and returns. Woven in Biella, made in Italy.",
    dragHint: "Drag to wander",
    clickHint: "Click a look to step closer",
    zoomHint: "Scroll to move through",
    view: "View",
    look: "Look",
}
const DEFAULT_PLANES: Planes = {
    farHeight: 120,
    farBlur: 3.5,
    farOpacity: 0.3,
    backHeight: 210,
    backBlur: 2,
    backOpacity: 0.6,
    midHeight: 340,
    frontHeight: 700,
    frontBlur: 3,
    frontDrop: 140,
}

/* ------------------------------------------------------------- controls */
// The looks themselves live in the CMS (Looks + Products). The panel only
// holds how the wall moves and looks, grouped from most to least used.
const LABEL_TITLES: Record<keyof Labels, string> = {
    dragHint: "Drag hint",
    clickHint: "Click hint",
    zoomHint: "Scroll hint",
    view: "Cursor label",
    look: "Look label",
    threePieces: "Pieces heading",
    viewLookPage: "Look page link",
    addToBag: "Add to bag",
    added: "Added",
    viewBag: "View bag",
    addFullLook: "Add full look",
    fullLookAdded: "Full look added",
    inYourBag: "In your bag",
    chooseSize: "Choose a size",
    soldOut: "Sold out",
    notifyMe: "Notify me",
    notifyThanks: "Notify thanks",
    sizeGuide: "Size guide",
    delivery: "Delivery note",
    close: "Close",
}

addPropertyControls(Salon as any, {
    source: {
        type: ControlType.Enum,
        title: "Looks from",
        options: ["cms", "sample"],
        optionTitles: ["CMS", "Sample"],
        defaultValue: "cms",
        displaySegmentedControl: true,
        description: "CMS: the Looks collection, ordered by Order, with up to three Products each (via the hidden Salon lists on this page). Edit looks and clothes in the CMS.",
    },
    seasonLink: { type: ControlType.Link, title: "Season link", description: "Optional. Makes the season line a link." },
    season: { type: ControlType.String, title: "Season line", defaultValue: "Autumn–Winter 2026, twelve looks", description: "Serif line, bottom left." },
    autoScroll: { type: ControlType.Number, title: "Auto-scroll", defaultValue: 24, min: 0, max: 120, step: 1, unit: "px/s", description: "The looks walk by on their own. 0 turns it off. Pauses on hover and drag." },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["rtl", "ltr"],
        optionTitles: ["← Right to left", "Left to right →"],
        defaultValue: "rtl",
        displaySegmentedControl: true,
        hidden: (p: any) => !p.autoScroll,
    },
    showIntro: { type: ControlType.Boolean, title: "Opening", defaultValue: true, description: "The wordmark lands, dissolves into the header logo, and the looks develop as the camera walks in." },
    motionSpeed: { type: ControlType.Number, title: "Pace", defaultValue: 1, min: 0.5, max: 1.5, step: 0.05, description: "Speed of the opening and of row changes. 1 is the designed pace.", hidden: (p: any) => p.showIntro === false },
    planes: {
        type: ControlType.Object,
        title: "Rows",
        buttonTitle: "Size, blur, depth",
        description: "Four rows in depth. Scroll moves them through focus. Heights in desktop px; phones scale down.",
        controls: {
            midHeight: { type: ControlType.Number, title: "Focus height", defaultValue: 340, min: 220, max: 480, unit: "px" },
            frontHeight: { type: ControlType.Number, title: "Front height", defaultValue: 700, min: 400, max: 900, unit: "px" },
            frontDrop: { type: ControlType.Number, title: "Front lower by", defaultValue: 140, min: 0, max: 320, unit: "px", description: "How far the near, blurred row stands below the focus row." },
            frontBlur: { type: ControlType.Number, title: "Front blur", defaultValue: 3, min: 0, max: 12, step: 0.5, unit: "px" },
            backHeight: { type: ControlType.Number, title: "Back height", defaultValue: 210, min: 120, max: 320, unit: "px" },
            backBlur: { type: ControlType.Number, title: "Back blur", defaultValue: 2, min: 0, max: 12, step: 0.5, unit: "px" },
            backOpacity: { type: ControlType.Number, title: "Back opacity", defaultValue: 0.6, min: 0, max: 1, step: 0.05 },
            farHeight: { type: ControlType.Number, title: "Far height", defaultValue: 120, min: 60, max: 240, unit: "px" },
            farBlur: { type: ControlType.Number, title: "Far blur", defaultValue: 3.5, min: 0, max: 12, step: 0.5, unit: "px" },
            farOpacity: { type: ControlType.Number, title: "Far opacity", defaultValue: 0.3, min: 0, max: 1, step: 0.05 },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        buttonTitle: "Hints and buttons",
        description: "Every word in the Salon. Translate them with Framer Localization.",
        controls: Object.fromEntries((Object.keys(LABEL_TITLES) as (keyof Labels)[]).map((k) => [k, { type: ControlType.String, title: LABEL_TITLES[k], defaultValue: DEFAULT_LABELS[k] }])) as any,
    },
    showMinimap: { type: ControlType.Boolean, title: "Minimap", defaultValue: true, description: "Small map bottom right; click to jump." },
    cursorView: { type: ControlType.Boolean, title: "View cursor", defaultValue: true, description: "Dot cursor that becomes a “View” disc over a look." },
    idleDrift: { type: ControlType.Boolean, title: "Breathing", defaultValue: true, description: "After 4 s without input the wall breathes gently." },
    wordmark: { type: ControlType.Image, title: "Logo", description: "Optional SVG or PNG. Leave empty for the Ombrine wordmark, animated letter by letter." },
})