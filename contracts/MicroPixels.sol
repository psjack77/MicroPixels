// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MicroPixels is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidCoordinates();
    error InvalidColor();
    error InvalidBatchLength();
    error InvalidAddress();
    error InvalidPrice();

    uint16 public constant WIDTH = 32;
    uint16 public constant HEIGHT = 32;
    uint16 public constant CANVAS_SIZE = WIDTH * HEIGHT;
    uint8 public constant MAX_BATCH = 10;
    uint256 public constant REQUIRED_PIXEL_PRICE = 10_000;

    IERC20 public immutable usdc;
    uint256 public immutable pixelPrice;

    struct Pixel {
        uint24 color;
        address owner;
        uint40 timestamp;
    }

    Pixel[CANVAS_SIZE] private _pixels;

    mapping(address => uint256) public pixelCounts;
    uint256 public totalUsdcCollected;

    address[] private _players;
    mapping(address => bool) private _seenPlayer;

    event PixelPlaced(address indexed player, uint16 x, uint16 y, uint24 color, uint256 totalPixels);

    constructor(address usdcAddress, uint256 pixelPrice_, address owner_) Ownable(owner_) {
        if (usdcAddress == address(0) || owner_ == address(0)) revert InvalidAddress();
        if (pixelPrice_ != REQUIRED_PIXEL_PRICE) revert InvalidPrice();

        usdc = IERC20(usdcAddress);
        pixelPrice = pixelPrice_;
    }

    function placePixel(uint16 x, uint16 y, uint24 color) external nonReentrant {
        _validateCoordinates(x, y);
        _validateColor(color);

        usdc.safeTransferFrom(msg.sender, address(this), pixelPrice);
        totalUsdcCollected += pixelPrice;

        _setPixel(x, y, color, msg.sender);
    }

    function placePixelBatch(
        uint16[] calldata x,
        uint16[] calldata y,
        uint24[] calldata colors
    ) external nonReentrant {
        uint256 length = x.length;
        if (length == 0 || length > MAX_BATCH || y.length != length || colors.length != length) {
            revert InvalidBatchLength();
        }

        usdc.safeTransferFrom(msg.sender, address(this), pixelPrice * length);
        totalUsdcCollected += pixelPrice * length;

        for (uint256 i = 0; i < length; i++) {
            _validateCoordinates(x[i], y[i]);
            _validateColor(colors[i]);
            _setPixel(x[i], y[i], colors[i], msg.sender);
        }
    }

    function getPixel(uint16 x, uint16 y) external view returns (uint24 color, address owner, uint40 timestamp) {
        _validateCoordinates(x, y);
        Pixel memory pixel = _pixels[_indexOf(x, y)];
        return (pixel.color, pixel.owner, pixel.timestamp);
    }

    function getCanvas() external view returns (uint24[CANVAS_SIZE] memory colors, address[CANVAS_SIZE] memory owners) {
        for (uint256 i = 0; i < CANVAS_SIZE; i++) {
            Pixel memory pixel = _pixels[i];
            colors[i] = pixel.color;
            owners[i] = pixel.owner;
        }
    }

    function getLeaderboard() external view returns (address[10] memory topPlayers, uint256[10] memory topCounts) {
        uint256 totalPlayers = _players.length;

        for (uint256 i = 0; i < totalPlayers; i++) {
            address player = _players[i];
            uint256 count = pixelCounts[player];

            if (count == 0) continue;

            for (uint256 j = 0; j < 10; j++) {
                if (count > topCounts[j]) {
                    for (uint256 k = 9; k > j; k--) {
                        topCounts[k] = topCounts[k - 1];
                        topPlayers[k] = topPlayers[k - 1];
                    }

                    topCounts[j] = count;
                    topPlayers[j] = player;
                    break;
                }
            }
        }
    }

    function withdraw(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();

        uint256 amount = usdc.balanceOf(address(this));
        if (amount > 0) {
            usdc.safeTransfer(to, amount);
        }
    }

    function _setPixel(uint16 x, uint16 y, uint24 color, address newOwner) internal {
        uint256 index = _indexOf(x, y);
        Pixel storage pixel = _pixels[index];

        address previousOwner = pixel.owner;
        if (previousOwner != address(0) && previousOwner != newOwner) {
            pixelCounts[previousOwner] -= 1;
        }

        if (previousOwner != newOwner) {
            _trackPlayer(newOwner);
            pixelCounts[newOwner] += 1;
        }

        pixel.color = color;
        pixel.owner = newOwner;
        pixel.timestamp = uint40(block.timestamp);

        emit PixelPlaced(newOwner, x, y, color, pixelCounts[newOwner]);
    }

    function _trackPlayer(address player) internal {
        if (!_seenPlayer[player]) {
            _seenPlayer[player] = true;
            _players.push(player);
        }
    }

    function _validateCoordinates(uint16 x, uint16 y) internal pure {
        if (x >= WIDTH || y >= HEIGHT) revert InvalidCoordinates();
    }

    function _validateColor(uint24 color) internal pure {
        if (color > 0xFFFFFF) revert InvalidColor();
    }

    function _indexOf(uint16 x, uint16 y) internal pure returns (uint16) {
        return x * WIDTH + y;
    }
}
