"""应用管理器模块

AED 急救互动剧情游戏的核心入口，负责初始化所有管理器、
注册服务、构建 Kivy 应用界面和生命周期管理。
"""

from typing import Optional

from kivy.app import App
from kivy.clock import Clock
from kivy.uix.screenmanager import ScreenManager
from kivy.core.window import Window

from src.core.app_context import AppContext
from src.core.event_bus import EventBus
from src.core.logger import get_logger, setup_logging
from src.core.resource_manager import ResourceManager
from src.core.save_manager import SaveManager
from src.core.scene_router import SceneRouter
from src.core.timer_manager import TimerManager
from src.ui.fonts import FONT_REGISTRY

logger = get_logger("app_manager")


class AEDGameApp(App):
    """Kivy 应用子类，构建游戏界面和管理生命周期。"""

    def __init__(self, app_manager: "AppManager", **kwargs) -> None:
        super().__init__(**kwargs)
        self._app_manager = app_manager
        self._screen_manager = ScreenManager()

    def build(self) -> ScreenManager:
        """构建应用根部件。

        Returns:
            ScreenManager 实例作为根部件
        """
        # 注册中文字体（必须在创建任何 Widget 之前执行）
        self._register_chinese_fonts()

        # 将 Kivy App 的 ScreenManager 传给 SceneRouter
        self._app_manager.scene_router = SceneRouter(self._screen_manager)

        # 注册所有场景
        self._app_manager._build_screens()

        # 默认打开启动页
        try:
            self._app_manager.scene_router.open("boot")
        except Exception as e:
            logger.error(f"打开启动页失败: {e}")

        # 绑定每帧 tick 到计时器管理器
        Clock.schedule_interval(self._on_frame, 0)

        # 设置窗口大小（模拟手机）
        Window.size = (390, 844)

        logger.info("AEDGameApp 构建完成")
        return self._screen_manager

    def _on_frame(self, dt: float) -> None:
        """每帧回调，推进计时器管理器。

        Args:
            dt: 距上一帧的时间间隔（秒）
        """
        timer_manager = self._app_manager.timer_manager
        if timer_manager:
            timer_manager.tick(dt)

    def get_screen_manager(self) -> ScreenManager:
        """获取应用的 ScreenManager。

        Returns:
            ScreenManager 实例
        """
        return self._screen_manager

    def _register_chinese_fonts(self) -> None:
        """确认中文字体已注册到 Kivy 字体系统。

        app.py 在 Kivy 初始化前已通过 Config.set 设置了 default_font，
        此方法作为二次确认，确保 LabelBase 中也已注册字体名。
        """
        from kivy.core.text import LabelBase
        import os

        for name, path in FONT_REGISTRY.items():
            if os.path.isfile(path):
                try:
                    if name not in LabelBase._fonts:
                        LabelBase.register(name, fn_regular=path)
                        logger.info(f"已注册字体: {name} -> {path}")
                    else:
                        logger.debug(f"字体已存在，跳过注册: {name}")
                except Exception as e:
                    logger.warning(f"注册字体 {name} 失败: {e}")

    def on_stop(self) -> None:
        """应用停止时的清理回调。"""
        self._app_manager.shutdown()
        logger.info("AEDGameApp 已停止")


class AppManager:
    """应用管理器，核心入口。

    负责初始化和协调所有子系统：事件总线、场景路由、资源管理、
    计时器管理和存档管理，并将它们注册到应用上下文中。
    """

    def __init__(self) -> None:
        self.app_context: AppContext = AppContext()
        self.event_bus: EventBus = EventBus()
        self.resource_manager: ResourceManager = ResourceManager()
        self.timer_manager: TimerManager = TimerManager()
        self.save_manager: SaveManager = SaveManager()
        self.scene_router: SceneRouter = SceneRouter()
        self._kivy_app: Optional[AEDGameApp] = None

        self._register_services()

    def _register_services(self) -> None:
        """将所有管理器注册到应用上下文。"""
        self.app_context.register_service("event_bus", self.event_bus)
        self.app_context.register_service("scene_router", self.scene_router)
        self.app_context.register_service("resource_manager", self.resource_manager)
        self.app_context.register_service("timer_manager", self.timer_manager)
        self.app_context.register_service("save_manager", self.save_manager)
        self.app_context.register_service("app_context", self.app_context)
        self.app_context.register_service("app_manager", self)
        logger.debug("所有服务已注册到 AppContext")

    def _build_screens(self) -> None:
        """导入并注册所有 UI Screen。"""
        router = self.scene_router

        from src.ui.screens.boot_screen import BootScreen
        from src.ui.screens.main_menu_screen import MainMenuScreen
        from src.ui.screens.scenario_select_screen import ScenarioSelectScreen
        from src.ui.screens.story_screen import StoryScreen
        from src.ui.screens.maze_screen import MazeScreen
        from src.ui.screens.result_screen import ResultScreen
        from src.ui.screens.history_screen import HistoryScreen
        from src.ui.screens.leaderboard_screen import LeaderboardScreen
        from src.ui.screens.settings_screen import SettingsScreen

        screen_classes = {
            "boot": BootScreen,
            "main_menu": MainMenuScreen,
            "scenario_select": ScenarioSelectScreen,
            "story": StoryScreen,
            "maze": MazeScreen,
            "result": ResultScreen,
            "history": HistoryScreen,
            "leaderboard": LeaderboardScreen,
            "settings": SettingsScreen,
        }

        for scene_id, screen_class in screen_classes.items():
            router.add_scene(scene_id, screen_class)

        logger.debug(f"场景构建完成，共注册 {len(screen_classes)} 个场景")

    def run(self) -> None:
        """启动 Kivy 应用。"""
        logger.info("启动 AED 急救互动剧情游戏")
        self.app_context.game_running = True

        self._kivy_app = AEDGameApp(app_manager=self)
        self._kivy_app.run()

    def shutdown(self) -> None:
        """清理并退出应用。"""
        logger.info("正在关闭应用...")
        self.app_context.game_running = False
        self.timer_manager.cancel_all()
        self.event_bus.clear()
        logger.info("应用已关闭")
